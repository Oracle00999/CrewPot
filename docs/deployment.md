# Deployment

Source repository: https://github.com/Oracle00999/CrewPot. Frontend hosting has not been configured.

## Devnet

The deployed program ID is `CV7eUQCnNZ9wYereuWFMG98sTDNp5k4QsSPF5rzqUgba`. It is deployed on Devnet and verified byte-for-byte against the tested binary. Deployment signature: `4PFUPHqxsAokNxaZLseP33mxM1NqLaepvAe52VZjJ5CgRvK96HvdmKGbrfP8vxycW8tMcQH39bs5W31c2KGKocR3`.

The deployer public address is `BE695N3pdm6Zn5QZdxWzB8JLUocDsQsS23tm1ZVzgVYw`. Its private key is stored outside the repository at `~/.config/solana/crewpot-deployer.json`. The developer funded it with 2.5 Devnet SOL, enabling deployment and demo setup. Use **Devnet SOL only** for future fees; do not transfer real SOL.

```sh
npm run contract:build
npm run contract:test
npm run demo:setup
solana program deploy --url devnet \
  --keypair ~/.config/solana/crewpot-deployer.json \
  --program-id target/deploy/crewpot-keypair.json --use-tpu-client target/deploy/crewpot.so
npm run demo:verify
```

Deployment and mint/account creation need sufficient test SOL. If the deployer balance is low, request enough test SOL and retry; do not repeatedly spam a rate-limited faucet. Keep the program keypair and upgrade authority backed up securely outside source control.

After a successful verification run, copy only the public `verification.json` report from `~/.config/solana/crewpot-demo/devnet/` into `docs/devnet-verification.json`. Confirm each signature in Solana Explorer with `cluster=devnet` before claiming a Devnet demonstration.

Update the frontend environment to the Devnet RPC, cluster, program, and mint from the Devnet manifest, then rebuild. Never publish the localnet build as a Devnet application.

## Frontend when publication resumes

1. Log into the intended GitHub and Vercel accounts locally; do not paste tokens into chat.
2. Verify the source tree excludes all secrets, `.env.local`, ledgers, and private keys.
3. Configure the four public environment variables from `.env.example` in the host.
4. Build using `npm run build`; deploy as a Next.js application.
5. Open the public URL and verify wallet connection, direct pot links, create/contribute/approve/release/refund, exact balances, and Explorer links.
6. Add the actual public URL and repository to the README.

The source repository is configured; there is no public frontend URL yet.

## Upgrade authority

The Devnet deployment is upgradeable. Once final tests pass, decide whether to make the Devnet demo immutable or transparently retain the upgrade authority for hackathon fixes. Revocation is irreversible and is deliberately not automated in these scripts. Never describe the program as completely trustless while an upgrade authority remains.

## Verified Devnet run

Demo mint: `6aZYZyWDDDfYQr6bBkLYBhXvHXjEMQ16oWwoDLTMUxsn`. All ten transaction signatures and balance assertions are recorded in `docs/devnet-verification.json`. The deployed binary checksum also appears in that report.

The public RPC WebSocket returned HTTP 503, so the application and scripts now confirm using HTTP signature-status polling. This path does not resubmit transactions. The RPC upload transport hit connection rate limits; resuming the preserved deployment buffer with `--use-tpu-client` completed the upload. Avoid running setup and deployment concurrently against the public RPC.

## Vercel configuration

The repository includes `vercel.json` with the Next.js framework preset, `npm ci` installation, and `npm run build` (Webpack). Node.js is pinned to 24.x in `package.json`. `.vercelignore` excludes local notes, environment files, keys, recording artifacts, Rust build output, and contract tooling from frontend uploads.

Configure these public values for Production builds:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_PROGRAM_ID` | `CV7eUQCnNZ9wYereuWFMG98sTDNp5k4QsSPF5rzqUgba` |
| `NEXT_PUBLIC_DEMO_MINT` | `6aZYZyWDDDfYQr6bBkLYBhXvHXjEMQ16oWwoDLTMUxsn` |

No deployer key, mint authority, or demo-wallet private key belongs in the hosting environment. After deployment, verify the landing page and a direct pot URL without logging into Vercel. The submission link must be the public production application URL.
