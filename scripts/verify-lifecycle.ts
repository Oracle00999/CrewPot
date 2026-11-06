import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { AnchorProvider, BN, Program, Wallet } from "@anchor-lang/core";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import idl from "../lib/contracts/crewpot.json";
import type { Crewpot } from "../lib/contracts/crewpot";
import {
  assertDemoNetwork,
  connection,
  demoDir,
  loadKey,
  manifest,
  network,
} from "./shared";

async function main() {
  await assertDemoNetwork();
  const config = manifest();
  const mint = new PublicKey(config.mint);
  const keys = [1, 2, 3].map((i) =>
    loadKey(path.join(demoDir, `member-${i}.json`)),
  );
  const p = (i: number) =>
    new Program<Crewpot>(
      idl as Crewpot,
      new AnchorProvider(connection, new Wallet(keys[i]), {
        commitment: "confirmed",
      }),
    );
  const source = (i: number) =>
    getAssociatedTokenAddressSync(mint, keys[i].publicKey);
  const recipient = keys[0].publicKey;
  const destination = source(0);
  const amount = 10_000_000n;
  const signatures: { action: string; signature: string }[] = [];
  async function record(action: string, result: Promise<string>) {
    const signature = await result;
    signatures.push({ action, signature });
    console.log(action, signature);
  }
  async function rejected(
    action: string,
    code: string,
    fn: () => Promise<unknown>,
  ) {
    await assert.rejects(fn, (error: unknown) => {
      const e = error as {
        error?: { errorCode?: { code?: string } };
        logs?: string[];
      };
      return (
        e.error?.errorCode?.code === code ||
        Boolean(e.logs?.some((log) => log.includes(`Error Code: ${code}.`)))
      );
    });
    console.log(`PASS: ${action} rejected`);
  }
  async function time() {
    const t = await connection.getBlockTime(await connection.getSlot());
    assert.notEqual(t, null);
    return t!;
  }
  async function create(title: string, ttl: number) {
    const potId = new BN(Date.now());
    const pot = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pot"),
        keys[0].publicKey.toBuffer(),
        potId.toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(idl.address),
    )[0];
    const vault = getAssociatedTokenAddressSync(mint, pot, true);
    const deadline = (await time()) + ttl;
    await record(
      `Create ${title}`,
      p(0)
        .methods.createPot({
          potId,
          title,
          description: "Real transaction verification run",
          contributionAmount: new BN(amount.toString()),
          members: keys.map((k) => k.publicKey),
          recipient,
          approvalThreshold: 2,
          deadline: new BN(deadline),
        })
        .accountsStrict({
          creator: keys[0].publicKey,
          pot,
          mint,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
    );
    return { pot, vault, deadline };
  }
  const success = await create("Weekend Gaming Fund", 900);
  const deposit = (i: number, round = success) =>
    p(i)
      .methods.contribute()
      .accountsStrict({
        member: keys[i].publicKey,
        pot: round.pot,
        mint,
        source: source(i),
        vault: round.vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  const release = () =>
    p(2)
      .methods.releaseFunds()
      .accountsStrict({
        pot: success.pot,
        mint,
        vault: success.vault,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  await rejected("Payout before approval", "NotAuthorized", release);
  for (let i = 0; i < 3; i++) await record(`Contribution ${i + 1}`, deposit(i));
  assert.equal(
    (await getAccount(connection, success.vault)).amount,
    3n * amount,
  );
  for (let i = 0; i < 2; i++)
    await record(
      `Approval ${i + 1}`,
      p(i)
        .methods.approvePayout()
        .accountsStrict({ member: keys[i].publicKey, pot: success.pot })
        .rpc(),
    );
  const before = (await getAccount(connection, destination)).amount;
  await record("Release payout", release());
  assert.equal(
    (await getAccount(connection, destination)).amount - before,
    3n * amount,
  );
  assert.equal((await getAccount(connection, success.vault)).amount, 0n);
  await rejected("Double payout", "AlreadyReleased", release);
  const failed = await create("Refund Protection Demo", 30);
  const beforeRefund = (await getAccount(connection, source(1))).amount;
  await record("Refund demo contribution", deposit(1, failed));
  const refund = () =>
    p(1)
      .methods.claimRefund()
      .accountsStrict({
        member: keys[1].publicKey,
        pot: failed.pot,
        mint,
        vault: failed.vault,
        destination: source(1),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  await rejected("Early refund", "RefundNotAvailable", refund);
  while ((await time()) < failed.deadline)
    await new Promise((resolve) => setTimeout(resolve, 1500));
  await record("Claim refund", refund());
  assert.equal((await getAccount(connection, source(1))).amount, beforeRefund);
  await rejected("Double refund", "AlreadyRefunded", refund);
  const report = {
    network,
    endpoint: connection.rpcEndpoint,
    programId: idl.address,
    payoutPot: success.pot.toBase58(),
    refundPot: failed.pot.toBase58(),
    checkedAt: new Date().toISOString(),
    signatures,
    assertions: [
      "early payout rejected",
      "exact deposits",
      "majority authorizes",
      "exact recipient balance delta",
      "vault empty after release",
      "double payout rejected",
      "early refund rejected",
      "exact refund",
      "double refund rejected",
    ],
  };
  writeFileSync(
    path.join(demoDir, "verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
