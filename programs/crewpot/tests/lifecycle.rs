use anchor_lang::{
    prelude::{Clock, Pubkey},
    solana_program::{
        instruction::Instruction, program_option::COption, program_pack::Pack, system_program,
    },
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use anchor_spl::{
    associated_token::{get_associated_token_address, ID as ATA_ID},
    token::{
        spl_token::state::{Account as TokenAccount, AccountState, Mint},
        ID as TOKEN_ID,
    },
};
use crewpot::{CreatePotArgs, PotAccount};
use litesvm::LiteSVM;
use solana_account::Account;
use solana_keypair::Keypair;
use solana_message::{Message, VersionedMessage};
use solana_signer::Signer;
use solana_transaction::versioned::VersionedTransaction;

const AMOUNT: u64 = 10_000_000;
const DEADLINE: i64 = 2_000;

#[test]
fn cross_pot_vault_substitution_rejected() {
    let mut f = Fixture::new();
    f.create();
    let first_vault = f.vault;
    f.pot = Pubkey::find_program_address(
        &[b"pot", f.users[0].pubkey().as_ref(), &2u64.to_le_bytes()],
        &crewpot::id(),
    )
    .0;
    f.vault = get_associated_token_address(&f.pot, &f.mint);
    let mut args = f.args();
    args.pot_id = 2;
    f.send(f.create_ix(args), 0).unwrap();
    let mut ix = f.contribute_ix(0);
    ix.accounts[4].pubkey = first_vault;
    assert!(f.send(ix, 0).is_err());
    assert_eq!(f.balance(first_vault), 0);
    assert_eq!(f.state().funded_count, 0);
}

#[test]
fn unsigned_member_cannot_deposit() {
    let mut f = Fixture::new();
    f.create();
    let mut ix = f.contribute_ix(0);
    ix.accounts[0].is_signer = false;
    assert!(f.send(ix, 3).is_err());
    assert_eq!(f.state().funded_count, 0);
}

#[test]
fn unsigned_contributor_cannot_refund() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    f.time(DEADLINE);
    let mut ix = f.refund_ix(0);
    ix.accounts[0].is_signer = false;
    assert!(f.send(ix, 3).is_err());
    assert!(!f.state().members[0].refunded);
}

#[test]
fn wrong_account_owner_rejected() {
    let mut f = Fixture::new();
    f.create();
    let mut account = f.svm.get_account(&f.sources[0]).unwrap();
    account.owner = system_program::ID;
    f.svm.set_account(f.sources[0], account).unwrap();
    assert!(f.contribute(0).is_err());
    assert_eq!(f.state().funded_count, 0);
}

#[test]
fn maximum_metadata_and_members_fit_account() {
    let mut f = Fixture::new();
    let mut args = f.args();
    args.title = "x".repeat(64);
    args.description = "x".repeat(280);
    args.members = f.users[..6].iter().map(Signer::pubkey).collect();
    args.approval_threshold = 4;
    f.send(f.create_ix(args), 0).unwrap();
    assert_eq!(f.state().members.len(), 6);
    assert_eq!(f.state().description.len(), 280);
}

#[test]
fn two_members_require_unanimity() {
    let mut f = Fixture::new();
    let mut args = f.args();
    args.members.truncate(2);
    f.send(f.create_ix(args), 0).unwrap();
    f.contribute(0).unwrap();
    f.contribute(1).unwrap();
    f.approve(0).unwrap();
    assert!(!f.state().payout_authorized);
    f.approve(1).unwrap();
    assert!(f.state().payout_authorized);
}

#[test]
fn immutable_agreement_survives_lifecycle() {
    let mut f = Fixture::new();
    f.create();
    let original = f.state();
    f.authorize();
    f.release().unwrap();
    let after = f.state();
    assert_eq!(original.creator, after.creator);
    assert_eq!(original.recipient, after.recipient);
    assert_eq!(original.mint, after.mint);
    assert_eq!(original.deadline, after.deadline);
    assert_eq!(original.contribution_amount, after.contribution_amount);
    assert_eq!(original.approval_threshold, after.approval_threshold);
    assert_eq!(
        original
            .members
            .iter()
            .map(|m| m.wallet)
            .collect::<Vec<_>>(),
        after.members.iter().map(|m| m.wallet).collect::<Vec<_>>()
    );
}

struct Fixture {
    svm: LiteSVM,
    users: Vec<Keypair>,
    mint: Pubkey,
    pot: Pubkey,
    vault: Pubkey,
    sources: Vec<Pubkey>,
    recipient: Pubkey,
    destination: Pubkey,
}

impl Fixture {
    fn new() -> Self {
        let mut svm = LiteSVM::new();
        svm.add_program(
            crewpot::id(),
            include_bytes!("../../../target/deploy/crewpot.so"),
        )
        .unwrap();
        let mut clock = svm.get_sysvar::<Clock>();
        clock.unix_timestamp = 1_000;
        svm.set_sysvar(&clock);
        let users: Vec<_> = (0..7)
            .map(|i| Keypair::new_from_array([i + 1; 32]))
            .collect();
        for user in &users {
            svm.airdrop(&user.pubkey(), 1_000_000_000).unwrap();
        }
        let mint = Pubkey::new_unique();
        Self::set_mint(&mut svm, mint, 6, COption::None);
        let pot = Pubkey::find_program_address(
            &[b"pot", users[0].pubkey().as_ref(), &1u64.to_le_bytes()],
            &crewpot::id(),
        )
        .0;
        let vault = get_associated_token_address(&pot, &mint);
        let sources: Vec<_> = users
            .iter()
            .map(|user| {
                let address = get_associated_token_address(&user.pubkey(), &mint);
                Self::set_token(&mut svm, address, user.pubkey(), mint, AMOUNT * 10);
                address
            })
            .collect();
        let recipient = users[6].pubkey();
        let destination = sources[6];
        Self {
            svm,
            users,
            mint,
            pot,
            vault,
            sources,
            recipient,
            destination,
        }
    }
    fn set_mint(svm: &mut LiteSVM, key: Pubkey, decimals: u8, freeze_authority: COption<Pubkey>) {
        let mut data = vec![0; Mint::LEN];
        Mint::pack(
            Mint {
                mint_authority: COption::None,
                supply: 1_000_000_000,
                decimals,
                is_initialized: true,
                freeze_authority,
            },
            &mut data,
        )
        .unwrap();
        svm.set_account(
            key,
            Account {
                lamports: 10_000_000,
                data,
                owner: TOKEN_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();
    }
    fn set_token(svm: &mut LiteSVM, key: Pubkey, owner: Pubkey, mint: Pubkey, amount: u64) {
        let mut data = vec![0; TokenAccount::LEN];
        TokenAccount::pack(
            TokenAccount {
                mint,
                owner,
                amount,
                delegate: COption::None,
                state: AccountState::Initialized,
                is_native: COption::None,
                delegated_amount: 0,
                close_authority: COption::None,
            },
            &mut data,
        )
        .unwrap();
        svm.set_account(
            key,
            Account {
                lamports: 10_000_000,
                data,
                owner: TOKEN_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();
    }
    fn args(&self) -> CreatePotArgs {
        CreatePotArgs {
            pot_id: 1,
            title: "Weekend Gaming Fund".into(),
            description: "Three friends, one shared goal".into(),
            contribution_amount: AMOUNT,
            members: self.users[..3].iter().map(Signer::pubkey).collect(),
            recipient: self.recipient,
            approval_threshold: 2,
            deadline: DEADLINE,
        }
    }
    fn send(&mut self, ix: Instruction, signer: usize) -> Result<(), String> {
        self.svm.expire_blockhash();
        let payer = &self.users[signer];
        let message =
            Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &self.svm.latest_blockhash());
        let tx =
            VersionedTransaction::try_new(VersionedMessage::Legacy(message), &[payer]).unwrap();
        self.svm
            .send_transaction(tx)
            .map(|_| ())
            .map_err(|e| format!("{e:?}"))
    }
    fn create_ix(&self, args: CreatePotArgs) -> Instruction {
        Instruction {
            program_id: crewpot::id(),
            accounts: crewpot::accounts::CreatePot {
                creator: self.users[0].pubkey(),
                pot: self.pot,
                mint: self.mint,
                vault: self.vault,
                token_program: TOKEN_ID,
                associated_token_program: ATA_ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: crewpot::instruction::CreatePot { args }.data(),
        }
    }
    fn create(&mut self) {
        self.send(self.create_ix(self.args()), 0).unwrap();
    }
    fn contribute_ix(&self, i: usize) -> Instruction {
        Instruction {
            program_id: crewpot::id(),
            accounts: crewpot::accounts::Contribute {
                member: self.users[i].pubkey(),
                pot: self.pot,
                mint: self.mint,
                source: self.sources[i],
                vault: self.vault,
                token_program: TOKEN_ID,
            }
            .to_account_metas(None),
            data: crewpot::instruction::Contribute {}.data(),
        }
    }
    fn contribute(&mut self, i: usize) -> Result<(), String> {
        self.send(self.contribute_ix(i), i)
    }
    fn approve(&mut self, i: usize) -> Result<(), String> {
        self.send(
            Instruction {
                program_id: crewpot::id(),
                accounts: crewpot::accounts::ApprovePayout {
                    member: self.users[i].pubkey(),
                    pot: self.pot,
                }
                .to_account_metas(None),
                data: crewpot::instruction::ApprovePayout {}.data(),
            },
            i,
        )
    }
    fn release_ix(&self) -> Instruction {
        Instruction {
            program_id: crewpot::id(),
            accounts: crewpot::accounts::ReleaseFunds {
                pot: self.pot,
                mint: self.mint,
                vault: self.vault,
                destination: self.destination,
                token_program: TOKEN_ID,
            }
            .to_account_metas(None),
            data: crewpot::instruction::ReleaseFunds {}.data(),
        }
    }
    fn release(&mut self) -> Result<(), String> {
        self.send(self.release_ix(), 5)
    }
    fn refund_ix(&self, i: usize) -> Instruction {
        Instruction {
            program_id: crewpot::id(),
            accounts: crewpot::accounts::ClaimRefund {
                member: self.users[i].pubkey(),
                pot: self.pot,
                mint: self.mint,
                vault: self.vault,
                destination: self.sources[i],
                token_program: TOKEN_ID,
            }
            .to_account_metas(None),
            data: crewpot::instruction::ClaimRefund {}.data(),
        }
    }
    fn refund(&mut self, i: usize) -> Result<(), String> {
        self.send(self.refund_ix(i), i)
    }
    fn fund(&mut self) {
        for i in 0..3 {
            self.contribute(i).unwrap();
        }
    }
    fn authorize(&mut self) {
        self.fund();
        self.approve(0).unwrap();
        self.approve(1).unwrap();
    }
    fn time(&mut self, timestamp: i64) {
        let mut clock = self.svm.get_sysvar::<Clock>();
        clock.unix_timestamp = timestamp;
        self.svm.set_sysvar(&clock);
    }
    fn state(&self) -> PotAccount {
        PotAccount::try_deserialize(&mut self.svm.get_account(&self.pot).unwrap().data.as_slice())
            .unwrap()
    }
    fn balance(&self, address: Pubkey) -> u64 {
        TokenAccount::unpack(&self.svm.get_account(&address).unwrap().data)
            .unwrap()
            .amount
    }
}

fn rejects(result: Result<(), String>, name: &str) {
    let err = result.expect_err("malicious instruction succeeded");
    assert!(err.contains(name), "expected {name}, got {err}");
}

macro_rules! invalid_creation {
    ($name:ident, $change:expr, $error:literal) => {
        #[test]
        fn $name() {
            let mut f = Fixture::new();
            let mut args = f.args();
            ($change)(&mut args, &f);
            rejects(f.send(f.create_ix(args), 0), $error);
            assert!(f.svm.get_account(&f.pot).is_none());
        }
    };
}
invalid_creation!(
    reject_zero_amount,
    |a: &mut CreatePotArgs, _: &Fixture| a.contribution_amount = 0,
    "InvalidAmount"
);
invalid_creation!(
    reject_overflow,
    |a: &mut CreatePotArgs, _: &Fixture| a.contribution_amount = u64::MAX,
    "Overflow"
);
invalid_creation!(
    reject_past_deadline,
    |a: &mut CreatePotArgs, _: &Fixture| a.deadline = 999,
    "InvalidDeadline"
);
invalid_creation!(
    reject_present_deadline,
    |a: &mut CreatePotArgs, _: &Fixture| a.deadline = 1000,
    "InvalidDeadline"
);
invalid_creation!(
    reject_duplicate_members,
    |a: &mut CreatePotArgs, _: &Fixture| a.members[1] = a.members[0],
    "DuplicateMember"
);
invalid_creation!(
    reject_creator_missing,
    |a: &mut CreatePotArgs, f: &Fixture| a.members[0] = f.users[4].pubkey(),
    "CreatorMissing"
);
invalid_creation!(
    reject_single_member,
    |a: &mut CreatePotArgs, _: &Fixture| a.members.truncate(1),
    "InvalidMembers"
);
invalid_creation!(
    reject_seven_members,
    |a: &mut CreatePotArgs, f: &Fixture| a.members = f.users.iter().map(Signer::pubkey).collect(),
    "InvalidMembers"
);
invalid_creation!(
    reject_minority,
    |a: &mut CreatePotArgs, _: &Fixture| a.approval_threshold = 1,
    "InvalidThreshold"
);
invalid_creation!(
    reject_unreachable_threshold,
    |a: &mut CreatePotArgs, _: &Fixture| a.approval_threshold = 4,
    "InvalidThreshold"
);
invalid_creation!(
    reject_blank_title,
    |a: &mut CreatePotArgs, _: &Fixture| a.title = "  ".into(),
    "InvalidMetadata"
);
invalid_creation!(
    reject_long_title,
    |a: &mut CreatePotArgs, _: &Fixture| a.title = "x".repeat(65),
    "InvalidMetadata"
);
invalid_creation!(
    reject_long_description,
    |a: &mut CreatePotArgs, _: &Fixture| a.description = "x".repeat(281),
    "InvalidMetadata"
);

#[test]
fn creation_and_exact_deposit() {
    let mut f = Fixture::new();
    f.create();
    assert_eq!(f.state().target_amount, 3 * AMOUNT);
    assert_eq!(f.state().recipient, f.recipient);
    f.contribute(0).unwrap();
    assert_eq!(f.balance(f.sources[0]), 9 * AMOUNT);
    assert_eq!(f.balance(f.vault), AMOUNT);
    assert_eq!(f.state().funded_count, 1);
    assert_eq!(f.state().total_contributed, AMOUNT);
}
#[test]
fn duplicate_pot_identifier_rejected() {
    let mut f = Fixture::new();
    f.create();
    assert!(f.send(f.create_ix(f.args()), 0).is_err());
}
#[test]
fn nonmember_deposit_rejected() {
    let mut f = Fixture::new();
    f.create();
    rejects(f.contribute(3), "NotMember");
}
#[test]
fn duplicate_deposit_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    rejects(f.contribute(0), "AlreadyContributed");
    assert_eq!(f.balance(f.vault), AMOUNT);
}
#[test]
fn deposit_at_deadline_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.time(DEADLINE);
    rejects(f.contribute(0), "Expired");
}
#[test]
fn nonmember_vote_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.fund();
    rejects(f.approve(3), "NotMember");
}
#[test]
fn noncontributor_vote_rejected() {
    let mut f = Fixture::new();
    f.create();
    rejects(f.approve(0), "NotContributed");
}
#[test]
fn early_vote_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    rejects(f.approve(0), "NotFullyFunded");
}
#[test]
fn duplicate_vote_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.fund();
    f.approve(0).unwrap();
    rejects(f.approve(0), "AlreadyApproved");
    assert_eq!(f.state().approval_count, 1);
}
#[test]
fn approval_at_deadline_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.fund();
    f.time(DEADLINE);
    rejects(f.approve(0), "Expired");
}
#[test]
fn release_before_funding_rejected() {
    let mut f = Fixture::new();
    f.create();
    rejects(f.release(), "NotAuthorized");
}
#[test]
fn release_before_quorum_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.fund();
    f.approve(0).unwrap();
    rejects(f.release(), "NotAuthorized");
}
#[test]
fn permissionless_release_and_double_release() {
    let mut f = Fixture::new();
    f.create();
    f.authorize();
    assert!(f.state().payout_authorized);
    f.release().unwrap();
    assert!(f.state().released);
    assert_eq!(f.balance(f.vault), 0);
    assert_eq!(f.balance(f.destination), 13 * AMOUNT);
    rejects(f.release(), "AlreadyReleased");
}
#[test]
fn authorized_release_after_deadline() {
    let mut f = Fixture::new();
    f.create();
    f.authorize();
    f.time(DEADLINE + 999);
    f.release().unwrap();
}
#[test]
fn exact_refund_at_deadline() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    f.time(DEADLINE);
    f.refund(0).unwrap();
    assert_eq!(f.balance(f.sources[0]), 10 * AMOUNT);
    assert!(f.state().members[0].refunded);
}
#[test]
fn fully_funded_without_quorum_refunds() {
    let mut f = Fixture::new();
    f.create();
    f.fund();
    f.approve(0).unwrap();
    f.time(DEADLINE);
    for i in 0..3 {
        f.refund(i).unwrap();
    }
    assert_eq!(f.balance(f.vault), 0);
    assert_eq!(f.state().total_refunded, 3 * AMOUNT);
}
#[test]
fn early_refund_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    rejects(f.refund(0), "RefundNotAvailable");
}
#[test]
fn noncontributor_refund_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.time(DEADLINE);
    rejects(f.refund(1), "NotContributed");
}
#[test]
fn nonmember_refund_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.time(DEADLINE);
    rejects(f.refund(3), "NotMember");
}
#[test]
fn duplicate_refund_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    f.time(DEADLINE);
    f.refund(0).unwrap();
    rejects(f.refund(0), "AlreadyRefunded");
}
#[test]
fn refund_after_authorization_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.authorize();
    f.time(DEADLINE);
    rejects(f.refund(0), "AlreadyAuthorized");
}
#[test]
fn refund_after_release_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.authorize();
    f.release().unwrap();
    f.time(DEADLINE);
    rejects(f.refund(0), "AlreadyAuthorized");
}
#[test]
fn independent_refund_entitlements() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    f.contribute(1).unwrap();
    f.time(DEADLINE);
    f.refund(1).unwrap();
    assert_eq!(f.balance(f.vault), AMOUNT);
    f.refund(0).unwrap();
    assert_eq!(f.balance(f.vault), 0);
}
#[test]
fn wrong_recipient_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.authorize();
    let mut ix = f.release_ix();
    ix.accounts[3].pubkey = f.sources[4];
    assert!(f.send(ix, 5).is_err());
    assert!(!f.state().released);
}
#[test]
fn wrong_refund_destination_rejected() {
    let mut f = Fixture::new();
    f.create();
    f.contribute(0).unwrap();
    f.time(DEADLINE);
    let mut ix = f.refund_ix(0);
    ix.accounts[4].pubkey = f.sources[1];
    assert!(f.send(ix, 0).is_err());
    assert!(!f.state().members[0].refunded);
}
#[test]
fn wrong_vault_rejected() {
    let mut f = Fixture::new();
    f.create();
    let mut ix = f.contribute_ix(0);
    ix.accounts[4].pubkey = f.sources[3];
    assert!(f.send(ix, 0).is_err());
    assert_eq!(f.state().funded_count, 0);
}
#[test]
fn wrong_mint_rejected() {
    let mut f = Fixture::new();
    f.create();
    let mint = Pubkey::new_unique();
    Fixture::set_mint(&mut f.svm, mint, 6, COption::None);
    let mut ix = f.contribute_ix(0);
    ix.accounts[2].pubkey = mint;
    assert!(f.send(ix, 0).is_err());
}
#[test]
fn source_owner_substitution_rejected() {
    let mut f = Fixture::new();
    f.create();
    let mut ix = f.contribute_ix(0);
    ix.accounts[3].pubkey = f.sources[1];
    assert!(f.send(ix, 0).is_err());
}
#[test]
fn wrong_pda_rejected() {
    let mut f = Fixture::new();
    let mut ix = f.create_ix(f.args());
    ix.accounts[1].pubkey = Pubkey::new_unique();
    assert!(f.send(ix, 0).is_err());
}
#[test]
fn token_program_substitution_rejected() {
    let mut f = Fixture::new();
    f.create();
    let mut ix = f.contribute_ix(0);
    ix.accounts[5].pubkey = system_program::ID;
    assert!(f.send(ix, 0).is_err());
}
#[test]
fn failed_transfer_preserves_state() {
    let mut f = Fixture::new();
    f.create();
    Fixture::set_token(&mut f.svm, f.sources[0], f.users[0].pubkey(), f.mint, 0);
    assert!(f.contribute(0).is_err());
    assert_eq!(f.state().funded_count, 0);
    assert!(!f.state().members[0].contributed);
    assert_eq!(f.balance(f.vault), 0);
}
#[test]
fn unsolicited_tokens_do_not_count_as_contributions() {
    let mut f = Fixture::new();
    f.create();
    Fixture::set_token(&mut f.svm, f.vault, f.pot, f.mint, 3 * AMOUNT);
    f.contribute(0).unwrap();
    rejects(f.approve(0), "NotFullyFunded");
}
#[test]
fn frozen_capable_mint_rejected() {
    let mut f = Fixture::new();
    Fixture::set_mint(&mut f.svm, f.mint, 6, COption::Some(f.users[0].pubkey()));
    rejects(f.send(f.create_ix(f.args()), 0), "UnsupportedMint");
}
#[test]
fn wrong_decimals_rejected() {
    let mut f = Fixture::new();
    Fixture::set_mint(&mut f.svm, f.mint, 9, COption::None);
    rejects(f.send(f.create_ix(f.args()), 0), "UnsupportedMint");
}
#[test]
fn six_member_strict_majority() {
    let mut f = Fixture::new();
    let mut args = f.args();
    args.members = f.users[..6].iter().map(Signer::pubkey).collect();
    args.approval_threshold = 4;
    f.send(f.create_ix(args), 0).unwrap();
    for i in 0..6 {
        f.contribute(i).unwrap();
    }
    for i in 0..3 {
        f.approve(i).unwrap();
    }
    assert!(!f.state().payout_authorized);
    f.approve(3).unwrap();
    assert!(f.state().payout_authorized);
}
