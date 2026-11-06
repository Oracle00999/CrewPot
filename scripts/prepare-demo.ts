import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AnchorProvider, BN, Program, Wallet } from "@anchor-lang/core";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import idl from "../lib/contracts/crewpot.json";
import type { Crewpot } from "../lib/contracts/crewpot";
import { assertDemoNetwork, connection, demoDir, loadKey, manifest, network } from "./shared";

type Scene = { address: string; deadline: number; potId: string };
type Report = { network: string; programId: string; preparedAt: string; payout?: Scene; refund?: Scene; signatures: { action: string; signature: string }[] };
async function main() {
  await assertDemoNetwork();
  const config = manifest();
  const keys = [1, 2, 3].map(i => loadKey(path.join(demoDir, `member-${i}.json`)));
  const mint = new PublicKey(config.mint);
  const program = (i: number) => new Program<Crewpot>(idl as Crewpot, new AnchorProvider(connection, new Wallet(keys[i]), { commitment: "confirmed" }));
  assert.equal(config.programId, idl.address);
  assert.deepEqual(config.members, keys.map(k => k.publicKey.toBase58()));
  const filename = path.join(demoDir, "recording.json");
  const report: Report = existsSync(filename) ? JSON.parse(readFileSync(filename, "utf8")) : { network, programId: idl.address, preparedAt: new Date().toISOString(), signatures: [] };
  assert.equal(report.network, network);
  assert.equal(report.programId, idl.address);
  const save = () => writeFileSync(filename, JSON.stringify(report, null, 2));
  const clock = async () => {
    const time = await connection.getBlockTime(await connection.getSlot());
    assert.notEqual(time, null);
    return time!;
  };
  const source = (i: number) => getAssociatedTokenAddressSync(mint, keys[i].publicKey);
  const vault = (pot: PublicKey) => getAssociatedTokenAddressSync(mint, pot, true);
  async function record(action: string, tx: Promise<string>) {
    const signature = await tx;
    report.signatures.push({ action, signature });
    save();
    console.log(action, signature);
  }
  async function create(kind: "payout" | "refund", ttl: number) {
    if (report[kind] && await connection.getAccountInfo(new PublicKey(report[kind]!.address))) return;
    const potId = new BN(report[kind]?.potId || Date.now());
    const pot = PublicKey.findProgramAddressSync([Buffer.from("pot"), keys[0].publicKey.toBuffer(), potId.toArrayLike(Buffer, "le", 8)], program(0).programId)[0];
    const deadline = report[kind]?.deadline || (await clock()) + ttl;
    // Persist the intended address before sending so interrupted runs can recover.
    report[kind] = { address: pot.toBase58(), deadline, potId: potId.toString() };
    save();
    await record(`Create ${kind} scene`, program(0).methods.createPot({ potId, title: kind === "payout" ? "Weekend Gaming Fund — Demo" : "Refund Protection — Demo", description: "Recording scene. Devnet test tokens only.", contributionAmount: new BN(10_000_000), members: keys.map(k => k.publicKey), recipient: keys[0].publicKey, approvalThreshold: 2, deadline: new BN(deadline) }).accountsStrict({ creator: keys[0].publicKey, pot, mint, vault: vault(pot), tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId }).rpc());
  }
  async function deposit(i: number, pot: PublicKey) {
    const state = await program(0).account.potAccount.fetch(pot);
    if (state.members[i].contributed) return;
    await record(`Member ${i + 1} contributes`, program(i).methods.contribute().accountsStrict({ member: keys[i].publicKey, pot, mint, source: source(i), vault: vault(pot), tokenProgram: TOKEN_PROGRAM_ID }).rpc());
  }
  const action = process.argv[2] || "prepare";
  const selectedMember = process.argv[3] === undefined ? undefined : Number(process.argv[3]) - 1;
  assert.ok(selectedMember === undefined || (Number.isInteger(selectedMember) && selectedMember >= 0 && selectedMember < 3), "Member must be 1, 2, or 3");
  assert.ok(["prepare", "fund", "approve", "release", "refund", "status"].includes(action), "Use prepare, fund, approve, release, refund, or status");
  if (action === "prepare") {
    await create("payout", 172800);
    await create("refund", 45);
    await deposit(1, new PublicKey(report.refund!.address));
  }
  assert.ok(report.payout && report.refund, "Run demo:prepare first");
  const payout = new PublicKey(report.payout.address);
  const refund = new PublicKey(report.refund.address);
  if (action === "fund") for (const i of selectedMember === undefined ? [0, 1, 2] : [selectedMember]) await deposit(i, payout);
  if (action === "approve") for (let i = 0; i < 2; i++) {
    if (selectedMember !== undefined && selectedMember !== i) continue;
    const state = await program(0).account.potAccount.fetch(payout);
    if (!state.members[i].approved) await record(`Member ${i + 1} approves`, program(i).methods.approvePayout().accountsStrict({ member: keys[i].publicKey, pot: payout }).rpc());
  }
  if (action === "release" && !(await program(0).account.potAccount.fetch(payout)).released) {
    const before = (await getAccount(connection, source(0))).amount;
    await record("Release 30 dUSDC", program(2).methods.releaseFunds().accountsStrict({ pot: payout, mint, vault: vault(payout), destination: source(0), tokenProgram: TOKEN_PROGRAM_ID }).rpc());
    assert.equal((await getAccount(connection, source(0))).amount - before, 30_000_000n);
  }
  if (action === "refund" && !(await program(0).account.potAccount.fetch(refund)).members[1].refunded) {
    assert.ok((await clock()) >= report.refund.deadline, "Refund deadline has not passed yet");
    const before = (await getAccount(connection, source(1))).amount;
    await record("Refund member 2: 10 dUSDC", program(1).methods.claimRefund().accountsStrict({ member: keys[1].publicKey, pot: refund, mint, vault: vault(refund), destination: source(1), tokenProgram: TOKEN_PROGRAM_ID }).rpc());
    assert.equal((await getAccount(connection, source(1))).amount - before, 10_000_000n);
  }
  const summary = [];
  for (const [name, scene] of [["payout", report.payout], ["refund", report.refund]] as const) {
    const pot = new PublicKey(scene.address);
    const state = await program(0).account.potAccount.fetch(pot);
    summary.push({ name, url: `${process.env.CREWPOT_DEMO_URL || "http://127.0.0.1:3002"}/pots/${scene.address}`, deadline: new Date(scene.deadline * 1000).toISOString(), expired: (await clock()) >= scene.deadline, funded: state.fundedCount, approvals: state.approvalCount, released: state.released, refunded: state.members.map(m => m.refunded), vaultBaseUnits: (await getAccount(connection, vault(pot))).amount.toString() });
  }
  writeFileSync(path.join(process.cwd(), "docs", "demo-scenes.json"), JSON.stringify({ ...report, scenes: summary }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
