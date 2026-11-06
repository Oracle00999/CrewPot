# Security notes

## Contract verification

The 55 tests in `programs/crewpot/tests/lifecycle.rs` execute the compiled SBF program in LiteSVM. They cover creation limits, duplicate and unauthorized actions, time boundaries, full funding, strict majority, exact balance effects, refunds, payout after expiry, cross-pot vault substitution, account ownership, absent signatures, wrong mint/destination/program/PDA, arithmetic overflow, maximum allocation, and rollback on failed token CPI.

Local RPC verification independently exercises the program through the generated TypeScript client. This complements, but does not replace, review and fuzzing. No external audit has occurred.

## Client and dependencies

The test runner was upgraded to remove reported critical advisories, and Anchor’s inherited TOML parser was overridden to its patched release. Legacy Solana dependencies still have inherited advisories, including `bigint-buffer`, streaming JSON utilities, and UUID utilities. The final audit reported 19 inherited advisories (16 moderate, 3 high, zero critical). Review the current output of `npm audit` before public exposure; do not interpret passing contract tests as a clean dependency audit.

`bigint-buffer` native bindings are not installed in this setup; the observed runtime uses the JavaScript fallback. The frontend does not accept TOML or use a stream-based JSON-RPC server. These facts narrow exposure but do not remove package advisories or establish production safety. Avoid force-upgrading the Solana SDK across incompatible major versions merely to silence an audit.

## Operational limits

- Network guards permit Devnet/localnet; production funds are out of scope.
- No private keys, mint-authority secrets, or deployer secrets are shipped to the browser.
- Never treat a wallet signature as a confirmed transaction. Unknown confirmation outcomes retain their signature and require checking before retrying.
- The program’s upgrade authority can replace its logic; disclose this until revoked.
- Unsolicited token transfers into vaults have no recovery path. There is no admin sweep.
- Standard SPL mint authority remains able to mint demo tokens; freezing is disabled.
- Do not use this prototype with real assets.
