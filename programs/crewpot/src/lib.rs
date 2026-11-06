use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, TransferChecked},
};

declare_id!("CV7eUQCnNZ9wYereuWFMG98sTDNp5k4QsSPF5rzqUgba");

pub const MAX_MEMBERS: usize = 6;
pub const MAX_TITLE: usize = 64;
pub const MAX_DESCRIPTION: usize = 280;

#[program]
pub mod crewpot {
    use super::*;

    pub fn create_pot(ctx: Context<CreatePot>, args: CreatePotArgs) -> Result<()> {
        let n = args.members.len();
        require!((2..=MAX_MEMBERS).contains(&n), PotError::InvalidMembers);
        require!(
            args.members.contains(&ctx.accounts.creator.key()),
            PotError::CreatorMissing
        );
        for (i, member) in args.members.iter().enumerate() {
            require!(
                !args.members[..i].contains(member),
                PotError::DuplicateMember
            );
            require!(*member != Pubkey::default(), PotError::InvalidMembers);
        }
        require!(
            args.recipient != Pubkey::default(),
            PotError::InvalidRecipient
        );
        require!(args.contribution_amount > 0, PotError::InvalidAmount);
        require!(
            args.approval_threshold as usize > n / 2 && args.approval_threshold as usize <= n,
            PotError::InvalidThreshold
        );
        require!(
            args.deadline > Clock::get()?.unix_timestamp,
            PotError::InvalidDeadline
        );
        require!(
            !args.title.trim().is_empty()
                && args.title.len() <= MAX_TITLE
                && args.description.len() <= MAX_DESCRIPTION,
            PotError::InvalidMetadata
        );
        require!(
            ctx.accounts.mint.decimals == 6 && ctx.accounts.mint.freeze_authority.is_none(),
            PotError::UnsupportedMint
        );
        let target = args
            .contribution_amount
            .checked_mul(n as u64)
            .ok_or(PotError::Overflow)?;
        let pot = &mut ctx.accounts.pot;
        pot.set_inner(PotAccount {
            creator: ctx.accounts.creator.key(),
            pot_id: args.pot_id,
            mint: ctx.accounts.mint.key(),
            recipient: args.recipient,
            contribution_amount: args.contribution_amount,
            target_amount: target,
            total_contributed: 0,
            total_refunded: 0,
            funded_count: 0,
            approval_threshold: args.approval_threshold,
            approval_count: 0,
            deadline: args.deadline,
            payout_authorized: false,
            released: false,
            bump: ctx.bumps.pot,
            title: args.title,
            description: args.description,
            members: args
                .members
                .into_iter()
                .map(|wallet| MemberEntry {
                    wallet,
                    contributed: false,
                    approved: false,
                    refunded: false,
                })
                .collect(),
        });
        emit!(PotCreated {
            pot: pot.key(),
            creator: pot.creator,
            target_amount: target,
            deadline: pot.deadline
        });
        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        require!(
            !pot.released && !pot.payout_authorized,
            PotError::AlreadyAuthorized
        );
        require!(
            Clock::get()?.unix_timestamp < pot.deadline,
            PotError::Expired
        );
        let i = pot.member_index(ctx.accounts.member.key())?;
        require!(!pot.members[i].contributed, PotError::AlreadyContributed);
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.source.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.member.to_account_info(),
                },
            ),
            pot.contribution_amount,
            ctx.accounts.mint.decimals,
        )?;
        pot.total_contributed = pot
            .total_contributed
            .checked_add(pot.contribution_amount)
            .ok_or(PotError::Overflow)?;
        pot.funded_count = pot.funded_count.checked_add(1).ok_or(PotError::Overflow)?;
        pot.members[i].contributed = true;
        emit!(ContributionMade {
            pot: pot.key(),
            member: ctx.accounts.member.key(),
            amount: pot.contribution_amount
        });
        if pot.fully_funded() {
            emit!(PotFullyFunded { pot: pot.key() });
        }
        Ok(())
    }

    pub fn approve_payout(ctx: Context<ApprovePayout>) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        require!(!pot.released, PotError::AlreadyReleased);
        require!(
            Clock::get()?.unix_timestamp < pot.deadline,
            PotError::Expired
        );
        let i = pot.member_index(ctx.accounts.member.key())?;
        require!(pot.members[i].contributed, PotError::NotContributed);
        require!(pot.fully_funded(), PotError::NotFullyFunded);
        require!(!pot.members[i].approved, PotError::AlreadyApproved);
        pot.members[i].approved = true;
        pot.approval_count = pot
            .approval_count
            .checked_add(1)
            .ok_or(PotError::Overflow)?;
        emit!(PayoutApproved {
            pot: pot.key(),
            member: ctx.accounts.member.key(),
            approvals: pot.approval_count
        });
        if !pot.payout_authorized && pot.approval_count >= pot.approval_threshold {
            pot.payout_authorized = true;
            emit!(PayoutAuthorized { pot: pot.key() });
        }
        Ok(())
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let pot = &ctx.accounts.pot;
        require!(!pot.released, PotError::AlreadyReleased);
        require!(
            pot.payout_authorized
                && pot.fully_funded()
                && pot.approval_count >= pot.approval_threshold,
            PotError::NotAuthorized
        );
        let id = pot.pot_id.to_le_bytes();
        let bump = [pot.bump];
        let seeds: &[&[u8]] = &[b"pot", pot.creator.as_ref(), &id, &bump];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: pot.to_account_info(),
                },
                &[seeds],
            ),
            pot.target_amount,
            ctx.accounts.mint.decimals,
        )?;
        emit!(FundsReleased {
            pot: pot.key(),
            recipient: pot.recipient,
            amount: pot.target_amount
        });
        ctx.accounts.pot.released = true;
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let pot = &ctx.accounts.pot;
        require!(
            !pot.payout_authorized && !pot.released,
            PotError::AlreadyAuthorized
        );
        require!(
            Clock::get()?.unix_timestamp >= pot.deadline,
            PotError::RefundNotAvailable
        );
        let i = pot.member_index(ctx.accounts.member.key())?;
        require!(pot.members[i].contributed, PotError::NotContributed);
        require!(!pot.members[i].refunded, PotError::AlreadyRefunded);
        let id = pot.pot_id.to_le_bytes();
        let bump = [pot.bump];
        let seeds: &[&[u8]] = &[b"pot", pot.creator.as_ref(), &id, &bump];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: pot.to_account_info(),
                },
                &[seeds],
            ),
            pot.contribution_amount,
            ctx.accounts.mint.decimals,
        )?;
        emit!(RefundClaimed {
            pot: pot.key(),
            member: ctx.accounts.member.key(),
            amount: pot.contribution_amount
        });
        let pot = &mut ctx.accounts.pot;
        pot.members[i].refunded = true;
        pot.total_refunded = pot
            .total_refunded
            .checked_add(pot.contribution_amount)
            .ok_or(PotError::Overflow)?;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreatePotArgs {
    pub pot_id: u64,
    pub title: String,
    pub description: String,
    pub contribution_amount: u64,
    pub members: Vec<Pubkey>,
    pub recipient: Pubkey,
    pub approval_threshold: u8,
    pub deadline: i64,
}

#[derive(Accounts)]
#[instruction(args: CreatePotArgs)]
pub struct CreatePot<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(init, payer = creator, space = 8 + PotAccount::INIT_SPACE,
        seeds = [b"pot", creator.key().as_ref(), &args.pot_id.to_le_bytes()], bump)]
    pub pot: Account<'info, PotAccount>,
    pub mint: Account<'info, Mint>,
    #[account(init, payer = creator, associated_token::mint = mint, associated_token::authority = pot)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    pub member: Signer<'info>,
    #[account(mut, seeds = [b"pot", pot.creator.as_ref(), &pot.pot_id.to_le_bytes()], bump = pot.bump, has_one = mint)]
    pub pot: Account<'info, PotAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = member)]
    pub source: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = pot)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ApprovePayout<'info> {
    pub member: Signer<'info>,
    #[account(mut, seeds = [b"pot", pot.creator.as_ref(), &pot.pot_id.to_le_bytes()], bump = pot.bump)]
    pub pot: Account<'info, PotAccount>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut, seeds = [b"pot", pot.creator.as_ref(), &pot.pot_id.to_le_bytes()], bump = pot.bump, has_one = mint)]
    pub pot: Account<'info, PotAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = pot)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = pot.recipient)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    pub member: Signer<'info>,
    #[account(mut, seeds = [b"pot", pot.creator.as_ref(), &pot.pot_id.to_le_bytes()], bump = pot.bump, has_one = mint)]
    pub pot: Account<'info, PotAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = pot)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = member)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct PotAccount {
    pub creator: Pubkey,
    pub pot_id: u64,
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub contribution_amount: u64,
    pub target_amount: u64,
    /// Historical deposits; never use raw vault balance to count funding.
    pub total_contributed: u64,
    pub total_refunded: u64,
    pub funded_count: u8,
    pub approval_threshold: u8,
    pub approval_count: u8,
    pub deadline: i64,
    pub payout_authorized: bool,
    pub released: bool,
    pub bump: u8,
    #[max_len(64)]
    pub title: String,
    #[max_len(280)]
    pub description: String,
    #[max_len(6)]
    pub members: Vec<MemberEntry>,
}

impl PotAccount {
    pub fn member_index(&self, wallet: Pubkey) -> Result<usize> {
        self.members
            .iter()
            .position(|m| m.wallet == wallet)
            .ok_or_else(|| error!(PotError::NotMember))
    }
    pub fn fully_funded(&self) -> bool {
        self.funded_count as usize == self.members.len()
            && self.total_contributed == self.target_amount
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct MemberEntry {
    pub wallet: Pubkey,
    pub contributed: bool,
    pub approved: bool,
    pub refunded: bool,
}

#[error_code]
pub enum PotError {
    #[msg("Choose between two and six valid members.")]
    InvalidMembers,
    #[msg("The creator must be a member.")]
    CreatorMissing,
    #[msg("Each member wallet must be unique.")]
    DuplicateMember,
    #[msg("Choose a valid recipient wallet.")]
    InvalidRecipient,
    #[msg("The contribution must be positive.")]
    InvalidAmount,
    #[msg("Approvals must require a strict majority of members.")]
    InvalidThreshold,
    #[msg("Choose a future deadline.")]
    InvalidDeadline,
    #[msg("Use a title of 1–64 bytes and a description of at most 280 bytes.")]
    InvalidMetadata,
    #[msg("Use a six-decimal SPL token with no freeze authority.")]
    UnsupportedMint,
    #[msg("The amount is too large.")]
    Overflow,
    #[msg("This wallet is not a member of the pot.")]
    NotMember,
    #[msg("This member has already contributed.")]
    AlreadyContributed,
    #[msg("The deadline has passed.")]
    Expired,
    #[msg("Payout is already authorized; refunds are unavailable.")]
    AlreadyAuthorized,
    #[msg("This pot has already paid out.")]
    AlreadyReleased,
    #[msg("Contribute before approving or claiming a refund.")]
    NotContributed,
    #[msg("All members must contribute before voting opens.")]
    NotFullyFunded,
    #[msg("This member has already approved.")]
    AlreadyApproved,
    #[msg("The pot needs full funding and majority approval.")]
    NotAuthorized,
    #[msg("Refunds become available at the deadline.")]
    RefundNotAvailable,
    #[msg("This member has already claimed their refund.")]
    AlreadyRefunded,
}

#[event]
pub struct PotCreated {
    pub pot: Pubkey,
    pub creator: Pubkey,
    pub target_amount: u64,
    pub deadline: i64,
}
#[event]
pub struct ContributionMade {
    pub pot: Pubkey,
    pub member: Pubkey,
    pub amount: u64,
}
#[event]
pub struct PotFullyFunded {
    pub pot: Pubkey,
}
#[event]
pub struct PayoutApproved {
    pub pot: Pubkey,
    pub member: Pubkey,
    pub approvals: u8,
}
#[event]
pub struct PayoutAuthorized {
    pub pot: Pubkey,
}
#[event]
pub struct FundsReleased {
    pub pot: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}
#[event]
pub struct RefundClaimed {
    pub pot: Pubkey,
    pub member: Pubkey,
    pub amount: u64,
}
