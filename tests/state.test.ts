import { describe, expect, it } from "vitest";
import { BN } from "@anchor-lang/core";
import { Keypair } from "@solana/web3.js";
import { availableAction, status, type Pot } from "../lib/solana";
const wallets = [1, 2, 3].map(
  (n) => Keypair.fromSeed(new Uint8Array(32).fill(n)).publicKey,
);
function fixture(): Pot {
  return {
    creator: wallets[0],
    potId: new BN(1),
    mint: wallets[2],
    recipient: wallets[1],
    contributionAmount: new BN(1),
    targetAmount: new BN(2),
    totalContributed: new BN(0),
    totalRefunded: new BN(0),
    fundedCount: 0,
    approvalThreshold: 2,
    approvalCount: 0,
    deadline: new BN(1000),
    payoutAuthorized: false,
    released: false,
    title: "Test",
    description: "",
    members: wallets
      .slice(0, 2)
      .map((wallet) => ({
        wallet,
        contributed: false,
        approved: false,
        refunded: false,
      })),
  };
}
describe("wallet actions and visible status", () => {
  it("requires a connected wallet", () =>
    expect(availableAction(fixture(), null, 999)).toBeUndefined());
  it("allows an eligible contribution before expiry", () =>
    expect(availableAction(fixture(), wallets[0], 999)).toBe("contribute"));
  it("does not invite an outsider to contribute", () =>
    expect(availableAction(fixture(), wallets[2], 999)).toBeUndefined());
  it("closes contribution exactly at expiry", () =>
    expect(availableAction(fixture(), wallets[0], 1000)).toBeUndefined());
  it("opens refunds exactly at expiry", () => {
    const p = fixture();
    p.members[0].contributed = true;
    expect(availableAction(p, wallets[0], 1000)).toBe("refund");
    expect(status(p, 1000)).toBe("Refunds available");
  });
  it("never shows a second refund", () => {
    const p = fixture();
    p.members[0].contributed = p.members[0].refunded = true;
    expect(availableAction(p, wallets[0], 1000)).toBeUndefined();
    expect(status(p, 1000)).toBe("Refunded");
  });
  it("opens voting only after every deposit", () => {
    const p = fixture();
    p.members[0].contributed = true;
    expect(availableAction(p, wallets[0], 999)).toBeUndefined();
    p.fundedCount = 2;
    expect(availableAction(p, wallets[0], 999)).toBe("approve");
    p.members[0].approved = true;
    expect(availableAction(p, wallets[0], 999)).toBeUndefined();
  });
  it("keeps authorized payout available after expiry to outsiders", () => {
    const p = fixture();
    p.payoutAuthorized = true;
    expect(availableAction(p, wallets[2], 1001)).toBe("release");
    expect(status(p, 1001)).toBe("Ready to release");
  });
  it("shows completion without further actions", () => {
    const p = fixture();
    p.released = p.payoutAuthorized = true;
    expect(availableAction(p, wallets[0], 1001)).toBeUndefined();
    expect(status(p, 1001)).toBe("Completed");
  });
});
