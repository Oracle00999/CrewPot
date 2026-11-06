# CrewPot: two-minute demo

## Prepared scenes

The recording has now executed the payout and refund; these addresses show the completed results. Prepare fresh scenes before another take. The real Devnet pots and creation signatures are in [demo-scenes.json](demo-scenes.json). Both scenes use the existing three demo wallets, six-decimal dUSDC, 10 dUSDC per member, and two required approvals. dUSDC has no monetary value.

- Payout scene: http://127.0.0.1:3003/pots/7K8xtp2STHQVYfwdLPDdYzq66RGSUJMNzDdVvxc1iDX3 — recorded from empty through three contributions, two approvals, and payout.
- Refund scene: http://127.0.0.1:3003/pots/GxbNrPtxpwsYYdPSzeBq7crHyXWUB9ucywHfesiE4rux — member 2 deposited and reclaimed 10 dUSDC after the deadline.
- Payout contributions and approvals must happen before November 8 at 6:44:16 PM WAT. Prepare new scenes if recording later.

Use the stable production preview at `http://127.0.0.1:3003`; startup commands are in [video production](video-production.md). Keep a browser tab on each scene and another on Solana Explorer, with Devnet selected. Use 1920×1080 if available. Hide notifications and keep private key files and wallet recovery screens out of the recording.

## Shot list and narration

| Time | Screen/action | Narration |
| --- | --- | --- |
| 0:00–0:15 | Landing page; open payout scene | “Meet CrewPot: shared money with rules your crew agrees on. Friends can pool funds without handing one person control before the group approves.” |
| 0:15–0:35 | Pot details; show member list, recipient, amount, deadline, threshold | “For our weekend gaming fund, three members commit ten demo USDC each. The recipient is fixed, the target is thirty, and two member approvals are required. These rules are stored on Solana.” |
| 0:35–0:55 | Three contributions; confirm progress reaches 30/30 | “Each member contributes from their own wallet. The money goes into the pot’s token vault. Everyone can see who has contributed and how much remains.” |
| 0:55–1:20 | Show payout locked; then two approvals | “Funding alone cannot release the money. Contributing members must approve. One vote leaves it locked; the second reaches the majority and authorizes the agreed payout.” |
| 1:20–1:40 | Release; show confirmed signature in Explorer | “Now anyone can finalize the transfer, but the destination cannot change. All thirty demo USDC go to the recipient selected when this pot was created.” |
| 1:40–1:55 | Switch to expired refund scene; member 2 claims | “If the deadline passes without authorization, contributors can reclaim their own money. Here, the contributor gets ten back without waiting for the organizer.” |
| 1:55–2:00 | Return to app/brand | “CrewPot runs on Solana Devnet. Your crew. Your money. Your rules.” |

The opening scene is already created. Call it a prepared pot; only narrate clicking Create if a fresh creation is actually recorded. Label any cuts or accelerated confirmation waits. The UI hides unauthorized payout actions: show the locked state, and use the existing contract verification evidence if explaining a rejected call.

## Wallet order and scene controls

| Role | Public address | Actions |
| --- | --- | --- |
| Member 1 / creator / recipient | `6giL7QQDe45Mo7h8RtZ3yuz7rLBTNmiSTg9wRawJtMGt` | Contribute, approve; receives 30 dUSDC |
| Member 2 | `AMNPu3LZqfYpXgE6QfjZP5gZmQr3cPfeHuNctG6HpSFi` | Contribute, approve; claims refund in second scene |
| Member 3 | `CJd1Bm4qenFotkWJo8TGbFzsBB6UUA285Rkj25VGH3AQ` | Contribute; can finalize payout |

Preferred recording: connect each demo wallet through a browser wallet, perform the actions in the app, and show the confirmation. Browser-wallet signing remains to be verified. Private keys stay outside the repository; never paste them into source, chat, or a recording.

The following terminal controls are an honest fallback and also allow rehearsal. They sign real Devnet transactions with the existing local demo wallets. If used in the video, show the terminal action and explain that signing is driven by the demo script; refresh the app to show the resulting on-chain state. Do not depict these as browser-wallet clicks.

```sh
npm run demo:scene -- status
npm run demo:scene -- fund
npm run demo:scene -- approve
npm run demo:scene -- release
npm run demo:scene -- refund
```

Run one command per scene and wait for confirmation. `fund` submits three contributions; `approve` submits two approvals. Commands skip actions already reflected on chain. Release and refund verify exact token balance changes. `status` refreshes the public evidence in `docs/demo-scenes.json`. Do not run the last four commands before recording unless deliberately rehearsing: completed transfers cannot be undone.

`npm run demo:prepare` reuses these scenes. For a fresh take after completing or expiring them, archive the public `recording.json` from `~/.config/solana/crewpot-demo/devnet/` under a different filename, then run preparation again. Keep all wallet files intact. If interrupted between creating an address and confirming its transaction, the saved address supports retry; if its deadline has expired before creation succeeds, archive the recording manifest and prepare afresh.

## Delivery status

Devnet deployment and the full scripted lifecycle are verified. A standalone Chrome recorder captured these scenes, with synthetic narration and explicit scripted-signing captions; see [video production](video-production.md). The original browser-control connection remains unavailable, and browser-wallet signing has not been verified. Source is available at [Oracle00999/CrewPot](https://github.com/Oracle00999/CrewPot). Public app hosting and video upload remain pending.
