import { createPublicKey, verify } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  Keypair,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  prepareWalletTransaction,
  serializeSignedWalletTransaction,
} from "../lib/wallet-transaction";

const member = Keypair.fromSeed(new Uint8Array(32).fill(7));
const recipient = Keypair.fromSeed(new Uint8Array(32).fill(8)).publicKey;
const blockhash = Keypair.fromSeed(new Uint8Array(32).fill(9)).publicKey.toBase58();
const transfer = (signer = member.publicKey) => new Transaction().add(
  SystemProgram.transfer({ fromPubkey: signer, toPubkey: recipient, lamports: 1 }),
);

describe("wallet transaction transport", () => {
  it("reproduces the mobile adapter's unsigned legacy serialization failure", () => {
    const tx = prepareWalletTransaction(transfer(), member.publicKey, blockhash, false);
    expect(() => tx.serialize()).toThrow(/Signature verification failed/);
  });

  it("can serialize before the native wallet signs when v0 is supported", () => {
    const tx = prepareWalletTransaction(transfer(), member.publicKey, blockhash, true);
    expect(tx).toBeInstanceOf(VersionedTransaction);
    const transported = VersionedTransaction.deserialize(tx.serialize());
    expect(transported.version).toBe(0);
    expect(transported.message.header.numRequiredSignatures).toBe(1);
    expect(transported.message.staticAccountKeys[0].equals(member.publicKey)).toBe(true);
  });

  it("preserves instructions, blockhash and accounts across unsigned transport", () => {
    const legacy = prepareWalletTransaction(transfer(), member.publicKey, blockhash, false) as Transaction;
    const versioned = prepareWalletTransaction(transfer(), member.publicKey, blockhash, true) as VersionedTransaction;
    const original = legacy.compileMessage();
    expect(versioned.message.recentBlockhash).toBe(blockhash);
    expect(versioned.message.staticAccountKeys.map(k => k.toBase58()))
      .toEqual(original.accountKeys.map(k => k.toBase58()));
    expect(Buffer.from(versioned.message.compiledInstructions[0].data))
      .toEqual(legacy.instructions[0].data);
  });

  it("requires an actual signature before the app submits a versioned transaction", () => {
    const tx = prepareWalletTransaction(transfer(), member.publicKey, blockhash, true);
    expect(() => serializeSignedWalletTransaction(tx)).toThrow(/Nothing was submitted/);
  });

  it("round-trips through wallet signing with a cryptographically valid signature", () => {
    const prepared = prepareWalletTransaction(transfer(), member.publicKey, blockhash, true);
    const walletTx = VersionedTransaction.deserialize(prepared.serialize());
    walletTx.sign([member]);
    const submitted = VersionedTransaction.deserialize(serializeSignedWalletTransaction(walletTx));
    const publicKey = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), member.publicKey.toBuffer()]),
      format: "der", type: "spki",
    });
    expect(verify(null, submitted.message.serialize(), publicKey, submitted.signatures[0])).toBe(true);
  });

  it("keeps strict signed serialization for wallets that only support legacy", () => {
    const tx = prepareWalletTransaction(transfer(), member.publicKey, blockhash, false) as Transaction;
    tx.sign(member);
    expect(Transaction.from(serializeSignedWalletTransaction(tx)).verifySignatures()).toBe(true);
  });

  it("rejects a stale member requiring a different wallet's signature", () => {
    expect(() => prepareWalletTransaction(transfer(recipient), member.publicKey, blockhash, true))
      .toThrow(/different wallet/);
  });
});
