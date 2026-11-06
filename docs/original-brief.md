# CREWPOT
## Complete Project Specification and Autonomous Development Brief

**Project:** CrewPot  
**Tagline:** Your crew. Your money. Your rules.  
**Hackathon:** MLH Solana Hackathon, November 6–8, 2026  
**Target:** Top 3 Overall, with DeFi Track as an additional opportunity  
**Developer:** Solo  
**Development assistant:** Codex  
**Blockchain:** Solana  
**Primary language:** TypeScript  
**Smart contract:** Rust + Anchor  
**Target environment:** Solana Devnet

---

# 1. YOUR ROLE AS CODEX

You are the lead engineer, architect, UI/UX designer, and technical implementation partner for CrewPot.

Your responsibility is to take this specification and build a complete, polished, functional hackathon submission.

I am a full-stack developer experienced with React, TypeScript, Node.js, PostgreSQL, and backend systems. I am comfortable using VS Code, terminal commands, Docker, and AI-assisted development.

You should operate autonomously, make reasonable technical decisions, inspect the project environment, implement features, run tests, debug errors, and prepare the final application.

Do not repeatedly ask me to choose libraries, approve routine implementation steps, or restate requirements.

Choose practical solutions that maximize implementation quality within the time available.

Important competition constraint:

The hackathon's published schedule lists hacking beginning November 6, 2026, at 12 PM Eastern (6 PM WAT), and final submissions on November 8 at 11:45 AM Eastern (5:45 PM WAT).

Before hacking officially begins, limit work to research, environment verification, dependency investigation, and implementation planning. Do not write CrewPot's application code, logo assets, smart contracts, or other project materials before the permitted development window.

Once the hackathon begins, execute this specification.

Review the final rules at:
https://events.mlh.com/events/15200-solana-hackathon

Use only newly developed project work, standard libraries, allowed tools, and permitted open-source dependencies.

## Primary objective

Deliver a functioning Solana application that demonstrates:

1. Creating a group contribution pot.
2. Inviting predefined members.
3. Contributing tokens to a secure onchain vault.
4. Tracking funding progress.
5. Approving the payout collectively.
6. Releasing funds to the group's chosen representative.
7. Refunding contributors when a round fails.
8. Verifying the actual transactions through Solana Explorer.

The finished product must feel like a usable application, not a collection of disconnected blockchain demonstrations.

---

# 2. PRODUCT OVERVIEW

## What is CrewPot?

CrewPot is a decentralized group contribution platform built on Solana.

It allows people to pool funds for a shared purpose while collectively controlling when those funds are released.

Instead of asking one group member to collect everyone's money and hold it personally, CrewPot temporarily holds contributions inside a Solana smart contract.

Members agree on the contribution amount, deadline, representative wallet, and payout approval threshold before the round begins.

Once the contribution target is reached and enough members approve the payout, the funds can be transferred to the designated recipient.

If the contribution or approval requirements aren't satisfied before the deadline, contributors can reclaim their individual deposits.

CrewPot does not dictate how the designated representative spends the money after an authorized transfer.

That responsibility belongs to the members who selected and approved the representative.

## Core value proposition

**Collect money together without giving one person unilateral control of the pooled funds before payout.**

## Key principle

No single participant, including the creator, should be able to withdraw the group's funds without satisfying the agreed rules.

The blockchain enforces the agreement.

## Product positioning

CrewPot is not:

- A bank.
- A traditional custodial savings app.
- A rotating savings platform in its initial version.
- A lending or yield protocol.
- An investment application.
- A marketplace.
- An AI-powered wallet.
- A system that guarantees how recipients spend funds.

CrewPot is a **programmable group contribution and collective payout platform**.

The application should prioritize clarity, convenience, and trust-minimized coordination.

---

# 3. REAL-WORLD USE CASES

The product should demonstrate several understandable use cases.

### Group purchases

Friends contribute money toward a shared purchase, such as gaming equipment or household appliances.

### Community contributions

Members contribute toward shared equipment, club resources, or community activities.

### Event funding

Friends contribute toward an event, trip, or group activity.

### Team expenses

Small teams pool resources for shared operational costs.

### Family contributions

Family members contribute toward a planned purchase or shared goal.

All scenarios follow the same underlying contract rules.

Avoid implementing separate smart contracts for each use case.

---

# 4. PRIMARY DEMONSTRATION

Use the following scenario as the application's main demo.

## Five friends buying a PS5

Five friends decide to contribute $100 each toward a $500 purchase.

One member is selected as the representative who will receive the funds after approval.

The group creates a pot with:

| Field | Value |
|---|---|
| Pot name | PS5 Crew Fund |
| Purpose | Buy a PS5 together |
| Members | 5 predefined wallets |
| Individual contribution | 100 USDC |
| Total target | 500 USDC |
| Approval threshold | 3 of 5 |
| Recipient | Selected representative wallet |
| Deadline | Chosen during creation |
| Currency | USDC-compatible token on Solana |

### Expected flow

1. A member creates the pot.
2. The creator adds the other four wallet addresses.
3. The representative wallet is selected.
4. The contribution amount and approval threshold are established.
5. Every member reviews the agreement.
6. Members individually deposit 100 USDC.
7. The contract holds the contributions.
8. The pot becomes fully funded.
9. Members vote to authorize the payout.
10. Once three valid approvals are recorded, the payout becomes executable.
11. The contract releases 500 USDC to the representative's token account.
12. The application displays the completed transaction.

The representative can now use the funds for the intended purchase.

CrewPot's responsibility ends after the authorized payout.

### Failed round example

The same five-person round is created, but only three members contribute before the deadline.

The target is not reached.

The contract allows each contributing member to reclaim their exact deposit.

Noncontributors cannot claim refunds.

No administrator can redirect the remaining deposits.

---

# 5. CORE PRODUCT RULES

These rules are mandatory. Implement them in the Solana program, not only in the frontend.

## Rule A: Fixed membership

For the hackathon MVP, each pot has a fixed list of eligible wallet addresses.

Use a maximum of six participants initially, unless increasing it is trivial and safe.

The creator must be included in the participant list.

Duplicate participants are not allowed.

The member list becomes immutable after pot creation.

This eliminates complicated membership changes, voting-right recalculations, and mid-round disputes.

## Rule B: Fixed contribution amount

Every member contributes the same amount for the MVP.

Example:

- 5 members.
- 100 tokens each.
- Total target: 500 tokens.

The contract calculates the target from the member count and contribution amount.

Avoid allowing arbitrary deposits or overfunding.

One contribution per member per pot.

## Rule C: Preselected recipient

The recipient wallet must be selected during pot creation.

The address is visible to all participants before they contribute.

For the MVP, make the recipient immutable.

If the group wants a different representative, members create a new pot.

Do not add arbitrary administrator powers to change the recipient.

The recipient does not have to be a contributing member, but this must be clearly displayed.

## Rule D: Majority approval

The creator selects the number of approvals needed.

Require a strict majority for the MVP.

For example:

- 2 members: 2 approvals.
- 3 members: 2 approvals.
- 4 members: at least 3 approvals.
- 5 members: at least 3 approvals.
- 6 members: at least 4 approvals.

The threshold must not exceed the participant count.

Only members who actually contributed may approve a payout.

Voting begins only after the contribution target is reached.

Each contributing wallet gets one approval.

An approval can be submitted only once.

All approvals are recorded onchain.

For simplicity, implement affirmative approvals only. Members who disagree can decline to approve and allow the deadline to expire.

## Rule E: No unauthorized withdrawals

Before payout approval, neither the creator, representative, nor another participant can withdraw the collective funds.

The only permitted movements are:

- Authorized final payout.
- Refund of a contributor's own deposit when the refund conditions are satisfied.

Never create a developer backdoor, emergency personal withdrawal method, or unrestricted administrator sweep.

## Rule F: Time-limited funding and approval

Use a single deadline for funding and payout approval in the MVP.

Before the deadline:

- Eligible members may contribute while the pot is open.
- Once fully funded, eligible contributors may approve the payout.

After the deadline:

- Contributions are closed.
- New approvals are closed.
- If the required approvals were not reached, contributors can claim refunds.

If quorum was reached before the deadline, the payout remains authorized and may be finalized afterward.

This last condition matters: funds must not become stuck just because the final payout transaction wasn't submitted before the deadline.

## Rule G: Refunds

After the deadline, if the payout was not authorized, contributors can withdraw their original contribution.

Refunds should work even when the funding target was reached but the approval threshold was not.

Each refund must:

- Require the original contributor's signature.
- Return the correct token amount to that contributor.
- Be claimable only once.
- Reject any unauthorized wallet.
- Reject claims after an authorized payout.

Refunds must not require the creator's cooperation.

Do not depend on a centralized scheduler to process refunds. The contract checks the deadline when a refund transaction is submitted.

## Rule H: No hidden platform fees

The hackathon MVP charges no CrewPot fee.

Participants may still pay network transaction fees and account-creation rent.

Communicate those separately from the contribution amount.

---

# 6. SMART CONTRACT ARCHITECTURE

## Technology

Use Rust and Anchor to implement the onchain program.

Start from a compatible, maintained Anchor template.

Use the standard SPL Token Program for MVP contributions.

Avoid unnecessary advanced token extensions.

Use program-derived addresses (PDAs) to manage vault authorization.

## Core program concept

Each pot has:

- An onchain state account.
- An immutable configuration.
- A fixed list of members.
- Per-member funding and approval records.
- A vault token account controlled by a program PDA.
- A deterministic path to the designated recipient.
- Refund functionality when the pot fails.

The frontend must never act as the source of truth for funds or approvals.

## Suggested state model

### PotAccount

Fields:

- `creator: Pubkey`
- `pot_id: u64`
- `title: String`
- `description: String`
- `mint: Pubkey`
- `recipient: Pubkey`
- `contribution_amount: u64`
- `target_amount: u64`
- `total_contributed: u64`
- `funded_count: u8`
- `approval_threshold: u8`
- `approval_count: u8`
- `deadline: i64`
- `payout_authorized: bool`
- `released: bool`
- `members: Vec<MemberEntry>`
- `bump: u8`
- Any other essential bookkeeping fields.

Limit string lengths and allocate account storage correctly.

Use integer token base units rather than floating-point amounts.

### MemberEntry

Fields:

- `wallet: Pubkey`
- `contributed: bool`
- `approved: bool`
- `refunded: bool`

The maximum member count should be bounded to avoid excessive account size and compute costs.

## Suggested PDA design

Derive each pot account deterministically using:

- A constant pot seed.
- The creator public key.
- A unique pot identifier.

Use the pot PDA to authorize the vault's token movements through signed cross-program invocations.

The vault should be associated with the correct mint and program-controlled authority.

## Required instructions

### `create_pot`

Inputs:

- Unique identifier.
- Title and description.
- Contribution amount.
- Participant addresses.
- Representative wallet.
- Approval threshold.
- Deadline.
- Token mint.

Validation:

- Valid future deadline.
- Unique participants.
- Creator included.
- Supported participant count.
- Positive contribution amount.
- Valid strict-majority threshold.
- Correct token mint.
- Arithmetic overflow protection.

The pot's configuration becomes immutable after creation.

### `contribute`

Transfers the exact required contribution from an eligible participant into the program-controlled vault.

Validation:

- Wallet belongs to the pot.
- Wallet has not contributed.
- Deadline has not passed.
- Pot has not been paid out.
- Token mint and vault are correct.
- Deposit is the expected amount.

Update the funded count and total amount.

### `approve_payout`

Records an affirmative payout vote.

Validation:

- Voter is a member.
- Voter has contributed.
- Pot is fully funded.
- Voter has not approved before.
- Deadline has not passed.
- Pot has not been released.

Update the approval count.

When the threshold is reached, set `payout_authorized = true`.

### `release_funds`

Transfers the authorized total to the fixed recipient.

Validation:

- Funding target was reached.
- Required approvals were reached.
- Payout was authorized before the deadline.
- Payout has not already occurred.
- Recipient is exactly the wallet saved at creation.
- All token accounts and mint addresses are correct.

After a successful transfer, mark the pot as released.

Allow this instruction to be called by anyone after authorization. It must not depend on the creator or representative being online.

### `claim_refund`

Allows a contributor to recover their deposit when the round has failed.

Validation:

- Deadline has passed.
- Payout was not authorized.
- Caller contributed.
- Caller hasn't been refunded.
- Correct destination token account.
- Correct refund amount.

Update the contributor's refunded state.

### Optional instructions

Only if the essential workflow is already working:

- Cancel an empty pot before anyone contributes.
- Close finalized accounts safely.
- Produce additional indexed events.
- Support a more convenient transaction-finalization flow.

Do not implement custom governance frameworks, yield logic, or complicated membership management.

## Contract events

Emit useful events where appropriate:

- `PotCreated`
- `ContributionMade`
- `PotFullyFunded`
- `PayoutApproved`
- `PayoutAuthorized`
- `FundsReleased`
- `RefundClaimed`

These events support activity tracking and transaction verification.

---

# 7. CRITICAL CONTRACT INVARIANTS

The contract must satisfy the following conditions:

1. A member cannot contribute twice.
2. A nonmember cannot contribute.
3. A member cannot approve twice.
4. A noncontributor cannot approve.
5. Approval cannot occur before full funding.
6. The recipient cannot be silently changed.
7. Funds cannot leave the vault without a valid payout or refund path.
8. A payout cannot happen twice.
9. A refund cannot happen twice.
10. A refund cannot happen after payout authorization.
11. Funding and approval cannot occur after the deadline.
12. The creator has no special withdrawal privilege.
13. Token accounts cannot be substituted to redirect funds.
14. Integer arithmetic cannot overflow.
15. Two different pots cannot share or misuse each other's vaults.
16. A failed transaction cannot partially corrupt funding or voting state.
17. Repeated or concurrent instructions cannot bypass the rules.
18. Token mint and vault authority validation must happen onchain.

Use Anchor account constraints, PDA seed verification, token ownership checks, and checked arithmetic.

Do not assume the frontend prevents malicious calls.

Test the program as if users can call instructions directly.

---

# 8. TOKEN STRATEGY

The demo will run on Solana Devnet.

For reliability, create a mock SPL token representing demo USDC, with six decimal places.

Display it explicitly as:

**Demo USDC (dUSDC) — No real monetary value.**

Never represent this test token as Circle-issued USDC.

Configure the token mint through environment variables.

Prepare a repeatable script to create the test mint and distribute balances to demo wallets.

Keep mint-authority private keys outside the repository and browser bundle.

Do not ship secrets in the frontend.

If useful, add a restricted Devnet-only faucet for testers. This is optional and must not delay the main workflow.

The smart contract should support the actual SPL Token Program, so that a future audited version can work with a permitted production stablecoin mint.

Do not deploy the MVP with real funds or describe it as production-audited.

---

# 9. PROPOSED TECHNOLOGY STACK

## Frontend

- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Accessible UI primitives such as shadcn/ui where useful.
- Lucide icons.
- Appropriate React state and query utilities.

## Solana

- Rust.
- Anchor.
- Solana Devnet.
- SPL Token Program.
- Associated Token Accounts.
- Program-derived addresses.
- Wallet Standard-compatible wallet integration.
- Solana RPC.
- Solana Explorer links.

Use the current official Solana frontend documentation to select mutually compatible SDK versions.

The ecosystem includes Solana Kit, modern wallet adapters, and legacy web3.js integrations. Do not mix incompatible versions.

Choose a setup known to work with Anchor's generated IDL and transaction calls.

Prefer a proven integration over an experimental migration.

Documentation:

- https://solana.com/docs/intro/quick-start/build-first-program
- https://solana.com/docs/programs/examples
- https://solana.com/docs/frontend
- https://solana.com/docs/tokens

## Backend

Do not introduce a separate backend service unless truly necessary.

The blockchain should be the authoritative store for:

- Members.
- Funding.
- Approvals.
- Recipient.
- Deadline.
- Payout status.
- Refund rights.

Pot metadata can be stored within bounded onchain fields.

A database is not required for the initial MVP.

If a lightweight backend becomes essential for a test-token faucet or additional indexing, keep it isolated and simple.

## Deployment

- Frontend: Vercel or another suitable static/serverless host.
- Solana program: Devnet.
- Repository: GitHub.
- Demo recording: publicly accessible video.

Use environment variables for the RPC URL, deployed program ID, cluster, and demo token mint.

---

# 10. USER EXPERIENCE AND SCREENS

The design must be polished enough to look like a believable consumer fintech product.

Avoid making the UI look like a generic hackathon boilerplate or blockchain explorer.

## Screen 1: Landing page

### Goal

Immediately communicate CrewPot's purpose.

Hero:

**Your crew. Your money. Your rules.**

Supporting text:

"Pool funds with people you trust. Set the rules together. Release money only when your crew agrees."

Primary CTA:

**Create a Pot**

Secondary CTA:

**Explore How It Works**

Visual:

An animated preview of a group funding a shared goal.

Show a contribution progress bar, member avatars, approval count, and payout status.

Additional sections:

- How CrewPot works.
- Why contributors remain in control.
- Common group use cases.
- Powered by Solana.
- Clear Devnet demo disclaimer.

Keep marketing copy short and specific.

## Screen 2: Wallet connection

Use familiar wallet connection patterns.

Requirements:

- Connect compatible Solana wallet.
- Show shortened wallet address.
- Display network.
- Show relevant token balance.
- Handle missing wallet.
- Handle connection rejection.
- Handle unsupported network.
- Handle disconnected state.

Do not request unnecessary signatures.

## Screen 3: Dashboard

After connecting, users should see relevant pots.

Suggested sections:

- Pots created.
- Pots joined.
- Awaiting contribution.
- Awaiting approval.
- Ready for payout.
- Completed rounds.
- Refunds available.

Display useful summary information:

- Pot name.
- Progress.
- Amount contributed.
- Members.
- Deadline.
- Current status.

For the MVP, direct shareable pot links are more important than sophisticated indexing.

Implement discovery reasonably using program accounts and available indexing patterns. If listing limitations exist, preserve correct direct-link functionality.

Do not fabricate pots or balances.

## Screen 4: Create Pot

Use a clear multi-step form.

### Step A: Details

Fields:

- Pot name.
- Short purpose.
- Contribution amount.
- Deadline.

Display the calculated total once membership is known.

### Step B: Members

Add wallet addresses for participants.

Validate address formats.

Prevent duplicates.

Include the creator.

Show total participants.

### Step C: Recipient

Select or paste the representative wallet address.

Display an explanation:

"This wallet receives the funds once your crew authorizes the payout."

Warn that the address cannot be changed after creation.

### Step D: Approval rules

Select the approval threshold, subject to strict-majority validation.

Example:

"3 of 5 members must approve."

### Step E: Review

Display:

- Total funding target.
- Individual contribution.
- Members.
- Recipient wallet.
- Approval threshold.
- Deadline.
- Token network.

Require the creator to review the immutable rules before signing.

After successful creation, open the new pot detail page.

## Screen 5: Pot Detail

This is the most important screen.

Include:

- Pot title.
- Purpose.
- Creator.
- Contribution target.
- Amount raised.
- Progress bar.
- Deadline.
- Selected recipient.
- Approval threshold.
- Member list.
- Transaction history.
- Current status.
- Contextual call-to-action.

Possible actions:

- Contribute.
- Approve payout.
- Release funds.
- Claim refund.
- Share invite.

Only display actions appropriate for the connected wallet and onchain state.

### Member list

For each member, show:

- Shortened wallet address.
- Contributor status.
- Approval status.
- Refund status where applicable.

Do not reveal unverified real-world identities.

### Funding visualization

Example:

**300 / 500 dUSDC collected**

3 of 5 members have contributed.

Use a smooth progress indicator.

### Voting visualization

Once fully funded:

**2 of 3 required approvals**

Show individual approvals and remaining votes.

### Payout confirmation

Once approved:

"Your crew has authorized this payout."

Display the fixed representative wallet and exact amount.

Provide a visible release transaction action when appropriate.

## Screen 6: Transaction feedback

Every transaction should have clear states:

- Preparing.
- Awaiting wallet confirmation.
- Submitted.
- Confirming.
- Confirmed.
- Failed.

After confirmation, display:

- Transaction signature.
- Amount.
- Sender or beneficiary.
- Network.
- Link to Solana Explorer.

Never show a transaction as complete merely because the wallet signed it.

## Screen 7: Refund state

When a round expires without authorization:

Display a clear explanation:

"This pot did not meet the required funding and approval conditions before its deadline."

If the connected wallet contributed and hasn't claimed:

Show **Claim My Refund**.

After confirmation, show the refund transaction and update the contributor state.

---

# 11. VISUAL DESIGN AND BRAND IDENTITY

## Brand name

**CrewPot**

## Tagline

**Your crew. Your money. Your rules.**

## Brand personality

- Friendly.
- Trustworthy.
- Modern.
- Social.
- Confident.
- Approachable.

The product should feel closer to a modern fintech consumer application than a complicated DeFi trading interface.

## Existing logo direction

The preferred concept is a three-person symbol positioned above an open pot or curved bowl.

The mark represents:

- Three members contributing.
- A shared destination for funds.
- Collective control.
- Cooperation.

The initial visual used three circular heads in lime, mint, and white, with a curved bowl beneath them.

I like this overall concept.

**Do not replace it with a completely unrelated logo. Refine it.**

### Logo refinement instructions

Create an original, polished SVG mark.

Keep the recognizable three-person group and open-pot symbolism.

Improve:

- Symmetry.
- Spacing.
- Stroke consistency.
- Alignment.
- Balance between the people and the pot.
- Recognition at small icon sizes.

Explore making the pot's curve subtly resemble the letter C.

Avoid a generic people emoji, clip-art aesthetic, or overcomplicated illustration.

The final mark should remain recognizable at favicon size.

Deliver:

- Primary horizontal logo.
- Stacked logo.
- Standalone brand mark.
- Light background variation.
- Dark background variation.
- SVG favicon.

Use SVG for sharp rendering.

Do not rely on generated raster artwork for the primary logo.

## Color palette

Primary dark green: `#102923`

Lime accent: `#A3E635`

Mint accent: `#5EEAD4`

White: `#FFFFFF`

Use near-white and muted gray-green supporting surfaces.

These colors may be refined slightly for contrast and accessibility while preserving the existing identity.

## UI direction

Prioritize:

- Clear typography.
- Generous whitespace.
- Subtle cards and shadows.
- Rounded corners.
- Excellent spacing.
- Strong visual hierarchy.
- Smooth but restrained animations.
- Mobile-friendly layouts.
- Accessible contrast.
- Visible focus states.
- Helpful empty and error states.

Use the accent colors with restraint.

Avoid excessive gradients, giant glowing effects, glassmorphism everywhere, or generic cryptocurrency imagery.

## Component direction

Create reusable components such as:

- BrandLogo.
- WalletConnectButton.
- PotCard.
- FundingProgress.
- MemberAvatar.
- MemberStatus.
- ApprovalProgress.
- CountdownTimer.
- TransactionStatus.
- RecipientCard.
- RefundAction.
- PotStatusBadge.

The interface must work on desktop and mobile.

---

# 12. APPLICATION STRUCTURE

Use a maintainable monorepo or similarly organized structure.

Suggested:

```text
crewpot/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   ├── pots/
│   │   ├── new/
│   │   └── [potId]/
│   └── layout.tsx
├── components/
│   ├── branding/
│   ├── wallet/
│   ├── pots/
│   └── ui/
├── lib/
│   ├── solana/
│   ├── contracts/
│   ├── formatting/
│   └── validation/
├── hooks/
├── programs/
│   └── crewpot/
├── tests/
├── scripts/
├── public/
│   └── branding/
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   └── demo-script.md
├── Anchor.toml
├── package.json
├── .env.example
└── README.md
```

Adapt this layout if the chosen Anchor and Next.js tools require a different structure.

Keep contract interactions separate from React presentation components.

Use strong TypeScript types.

Avoid unnecessary abstractions.

---

# 13. ERROR HANDLING

The UI and program must handle errors gracefully.

Important cases:

- Wallet disconnected.
- Wrong network.
- Insufficient token balance.
- Insufficient SOL for transaction fees.
- Invalid participant address.
- Duplicate member.
- Unsupported token mint.
- Expired deadline.
- Contribution already made.
- Pot already fully funded.
- Wallet not eligible.
- Voting not yet open.
- Vote already recorded.
- Approval threshold not reached.
- Payout already executed.
- Refund not available.
- Refund already claimed.
- Transaction rejected.
- RPC timeout.
- Transaction confirmation failure.
- Temporary RPC rate limits.

Map contract error codes to understandable messages.

Avoid displaying only raw hexadecimal errors.

Never silently ignore transaction failures.

---

# 14. REQUIRED TESTS

Testing is not optional.

Write automated tests for the contract and run them.

## Creation tests

- Create valid pot.
- Reject invalid deadline.
- Reject zero contribution.
- Reject duplicate members.
- Reject duplicate pot identifier.
- Reject invalid approval threshold.
- Reject creator missing from member list.
- Reject excessive member count.

## Contribution tests

- Valid member contributes.
- Nonmember rejected.
- Duplicate contribution rejected.
- Expired pot rejects contribution.
- Correct token amount transferred.
- Incorrect token mint rejected.
- Funding progress updates correctly.

## Voting tests

- Fully funded contributor approves.
- Nonmember cannot approve.
- Noncontributor cannot approve.
- Duplicate approval rejected.
- Approval before full funding rejected.
- Approval after expiry rejected.
- Majority threshold correctly authorizes payout.

## Payout tests

- Early payout rejected.
- Unauthorized payout rejected.
- Approved payout succeeds.
- Correct recipient receives funds.
- Incorrect recipient token account rejected.
- Double payout rejected.
- Recipient cannot be changed.
- Payout remains executable after expiry if quorum was reached before expiry.

## Refund tests

- Expired unsuccessful round permits refund.
- Funded but unapproved expired round permits refund.
- Refund before expiry rejected.
- Contributor receives exact amount.
- Noncontributor cannot claim.
- Double refund rejected.
- Refund following payout authorization rejected.
- One member's refund cannot affect another's entitlement.

## Security tests

- Malicious account substitutions.
- Wrong vault.
- Wrong mint.
- Wrong recipient.
- Incorrect PDA seeds.
- Arithmetic overflow boundaries.
- Repeated instructions.
- Account ownership validation.

Use local testing with appropriate Solana test tooling.

Use deterministic fixtures.

Do not claim a test passes until it has actually been run.

---

# 15. DEMO AND PRESENTATION STRATEGY

The target is an impressive, functional two-minute demonstration.

Show the actual application interacting with Solana Devnet.

Avoid spending most of the video describing slides.

## Recommended demo scenario

Use three participants to reduce demonstration complexity.

Create a pot:

- Name: Weekend Gaming Fund.
- Three members.
- 10 dUSDC each.
- Total target: 30 dUSDC.
- Two approvals required.
- One selected representative.

### Demo sequence

**0:00–0:15 — Problem**

Introduce CrewPot.

Explain that friends should not need to give one person control of their money before the group approves a payout.

**0:15–0:35 — Create**

Show creation with fixed contribution amount, recipient, and approval rules.

**0:35–0:55 — Contribute**

Switch between demo wallets or prepared browser sessions.

Show actual confirmed contributions.

Watch the progress bar reach 100%.

**0:55–1:20 — Approve**

Show a payout attempt failing before authorization.

Then record the required member approvals.

Display the successful threshold.

**1:20–1:40 — Release**

Execute the payout.

Show the representative receiving the correct token amount.

Open the transaction in Solana Explorer.

**1:40–1:55 — Refund protection**

Switch to a separate expired demo pot.

Show an eligible contributor reclaiming their funds.

**1:55–2:00 — Closing**

"Your crew. Your money. Your rules."

Display the CrewPot brand.

The hackathon name must appear at the start of the final video if required by MLH.

Use actual transactions and clearly identify any shortened or pre-recorded segments. Never manufacture blockchain transaction evidence.

---

# 16. 48-HOUR IMPLEMENTATION PLAN

Time allocation is flexible, but prioritize the program's working transaction lifecycle.

## Phase 1: Foundation — First 4 hours

- Inspect toolchain and environment.
- Initialize repository during the permitted hacking window.
- Install compatible dependencies.
- Configure Anchor.
- Configure Solana Devnet.
- Establish frontend application.
- Implement core layout and branding.
- Create token-mint setup script.
- Define pot states and invariants.

Deliverable: Running frontend and compiling Anchor project.

## Phase 2: Core program — Next 9 hours

- Implement pot creation.
- Implement contributor validation.
- Implement deposits.
- Implement approval voting.
- Implement payout release.
- Implement refunds.
- Implement PDA vault authority.
- Emit events.
- Write contract tests.

Deliverable: Complete working contract tested locally.

Prioritize correctness over UI decoration.

## Phase 3: Frontend integration — Next 9 hours

- Wallet integration.
- Create Pot workflow.
- Pot detail screen.
- Contributions.
- Approval interface.
- Payout interface.
- Refund interface.
- Confirmation handling.
- Explorer integration.

Deliverable: Full user journey operating against the real program.

## Phase 4: Deployment and end-to-end tests — Next 7 hours

- Deploy Anchor program to Devnet.
- Configure program ID.
- Configure demo mint.
- Fund testing wallets.
- Execute complete funding and payout flow.
- Execute refund flow.
- Deploy frontend publicly.
- Test shareable links.
- Verify all onchain balances.

Deliverable: Public working demonstration.

## Phase 5: UI polish — Next 7 hours

- Improve logo.
- Improve responsive layouts.
- Add loading states.
- Improve error handling.
- Refine animations.
- Improve dashboard.
- Add transactions and status history.
- Fix visible inconsistencies.

Deliverable: Product-quality demonstration experience.

## Phase 6: Submission — Final 12 hours

- Run final regression tests.
- Perform security review.
- Fix critical bugs.
- Prepare README.
- Create architecture diagram.
- Record demo.
- Publish source repository.
- Verify public deployment.
- Prepare Devpost description.
- Verify submission requirements.
- Submit before the deadline.

Do not spend all available time implementing optional features.

Reserve enough time for deployment difficulties and final submission.

---

# 17. PRIORITY LEVELS

## P0: Absolutely required

- Secure contract-controlled token vault.
- Pot creation.
- Fixed membership.
- Contributions.
- Contribution tracking.
- Approval voting.
- Authorized payout.
- Refunds.
- Working wallet integration.
- Devnet deployment.
- Public frontend.
- Tests.
- Demo video.
- Public source repository.

## P1: Strongly preferred

- Beautiful interface.
- Refined logo.
- Dashboard.
- Shareable pot links.
- Transaction history.
- Explorer links.
- Responsive design.
- Good error handling.
- Clear contribution and approval visuals.

## P2: Only if time remains

- Public demo token faucet.
- Pot templates.
- Notifications.
- Advanced member discovery.
- QR-code invitations.
- Multiple contribution amounts.
- Early pot cancellation.
- Advanced analytics.

## Explicitly out of scope

- Mainnet deployment.
- Real-money onboarding.
- Token swaps.
- Fiat payment gateways.
- Yield generation.
- Lending.
- Cross-chain bridging.
- AI agents.
- Rotating savings payouts.
- Physical purchase verification.
- Representative identity verification.
- Dispute resolution.
- Arbitrary membership changes.
- Platform fees.

Do not add these features merely to make the project look bigger.

---

# 18. IMPLEMENTATION QUALITY REQUIREMENTS

Use the following development principles:

### Working software first

Complete the critical workflow before implementing advanced UI polish.

### Real onchain state

Do not fake funding progress, votes, payouts, or refunds.

The application's authoritative data must come from the contract.

### No unnecessary infrastructure

Avoid PostgreSQL, Redis, job queues, or microservices unless the product cannot function without them.

### Secure financial logic

No hardcoded private keys.

No unrestricted administrator withdrawals.

No wallet signing without clear user confirmation.

No production-fund claims.

### Reliable development

After each major feature:

- Run relevant tests.
- Fix errors.
- Check integrations.
- Review program constraints.
- Commit meaningful changes.

Use clear commit messages.

### Honest progress reporting

Distinguish between:

- Implemented.
- Tested locally.
- Tested on Devnet.
- Deployed.
- Unfinished.

Do not claim something works without verifying it.

---

# 19. README REQUIREMENTS

Prepare a professional repository README.

Include:

1. Project name and tagline.
2. Problem statement.
3. CrewPot solution.
4. Key features.
5. Solana architecture.
6. Smart contract rules.
7. Technology stack.
8. Local setup instructions.
9. Environment configuration.
10. Running the frontend.
11. Running contract tests.
12. Devnet deployment instructions.
13. Demo token setup.
14. Program ID.
15. Public demo URL.
16. Demo video URL.
17. Screenshots.
18. Known limitations.
19. Future roadmap.
20. AI-assisted development disclosure as required by event rules.

The README should make the application understandable to judges and other developers.

---

# 20. FUTURE PRODUCT DIRECTION

CrewPot's architecture should leave room for post-hackathon expansion.

Possible future features include:

- Flexible contribution amounts.
- Recurring group contributions.
- Rotating payout rounds.
- Group contribution history.
- Multisig-style treasury management.
- Contribution reminders.
- Onchain group identity.
- Additional supported stablecoins.
- Optional payment links.
- Group-specific governance settings.
- Mobile wallet integration.
- Secure dispute and recovery mechanisms.

Do not implement these during the MVP unless core functionality is already complete.

The goal is to demonstrate a credible foundation.

---

# 21. SUCCESS CRITERIA

CrewPot is considered hackathon-ready only when the following workflow succeeds:

A user connects their wallet and creates a pot with eligible participants, a fixed contribution amount, a deadline, and a designated recipient.

The pot is created on Solana Devnet.

Eligible participants contribute the exact required tokens.

The vault balance and onchain state reflect their deposits.

The pot reaches its target.

Members submit approvals through their wallets.

An attempt to release funds before authorization fails.

Once the required approvals are reached, the contract permits payout to the fixed recipient.

The recipient receives the correct amount.

A second payout attempt fails.

A separate unsuccessful pot reaches its deadline.

Eligible contributors recover their individual deposits.

The frontend correctly reflects every step.

The complete process can be demonstrated from a publicly accessible application, supported by verifiable transaction signatures.

The essential workflow must be reproducible without simulated financial state.

---

# 22. HOW TO EXECUTE THIS PROJECT

Codex, take ownership of the technical implementation.

Begin by inspecting the environment and establishing a clear implementation plan.

Respect the hackathon's official start time before creating project code or assets.

When implementation is permitted:

1. Select the appropriate toolchain and compatible versions.
2. Create the project structure.
3. Implement and test the Solana program first.
4. Integrate the frontend.
5. Build the complete transaction flows.
6. Refine the branding and interface.
7. Deploy to Devnet.
8. Deploy the frontend.
9. Test the public application.
10. Prepare the documentation and submission.

Make sensible decisions independently.

If a feature is proving too expensive to implement, simplify the feature without weakening fund safety or violating the agreed product rules.

Avoid lengthy theoretical discussions when implementation can establish the answer.

Do not stop at scaffolding.

Do not stop after generating mock UI screens.

Do not claim completion until the functional transaction lifecycle has been verified.

Maintain a concise progress summary containing:

- Completed functionality.
- Current task.
- Verified tests.
- Remaining blockers.
- Next actions.

When the project is complete, provide the deployment URL, program ID, GitHub repository, verified test results, and remaining submission requirements.

## FINAL PRODUCT VISION

**CrewPot**

*Your crew. Your money. Your rules.*

A simple way for people to contribute toward shared goals, hold funds under agreed rules, and release those funds only when their crew authorizes the payout.

Built on Solana.

Designed for real people.

Simple to understand.

Secure in its core rules.

Polished enough to stand out.

Focused enough to finish in 48 hours.

**Build CrewPot as a real working product, not merely a hackathon concept.**
