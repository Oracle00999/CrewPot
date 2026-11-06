import { AnchorProvider, BN, Program, type Wallet } from "@anchor-lang/core";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  getMint,
} from "@solana/spl-token";
import idl from "@/lib/contracts/crewpot.json";
import type { Crewpot } from "@/lib/contracts/crewpot";

export const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
export const rpc =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const mintAddress = process.env.NEXT_PUBLIC_DEMO_MINT || "";
export const programId = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || idl.address,
);
export const connection = new Connection(rpc, "confirmed");
export function program(wallet?: Wallet) {
  if (programId.toBase58() !== idl.address)
    throw new Error(
      "Program ID and generated IDL do not match. Rebuild and sync the IDL.",
    );
  return new Program<Crewpot>(
    idl as Crewpot,
    wallet
      ? new AnchorProvider(connection, wallet, { commitment: "confirmed" })
      : { connection },
  );
}
export type Member = {
  wallet: PublicKey;
  contributed: boolean;
  approved: boolean;
  refunded: boolean;
};
export type Pot = {
  creator: PublicKey;
  potId: BN;
  mint: PublicKey;
  recipient: PublicKey;
  contributionAmount: BN;
  targetAmount: BN;
  totalContributed: BN;
  totalRefunded: BN;
  fundedCount: number;
  approvalThreshold: number;
  approvalCount: number;
  deadline: BN;
  payoutAuthorized: boolean;
  released: boolean;
  title: string;
  description: string;
  members: Member[];
};
export type PotRecord = { publicKey: PublicKey; account: Pot };
export type PotStatus =
  | "Collecting"
  | "Awaiting approval"
  | "Ready to release"
  | "Completed"
  | "Refunds available"
  | "Refunded";
export function status(pot: Pot, now: number): PotStatus {
  if (pot.released) return "Completed";
  if (pot.payoutAuthorized) return "Ready to release";
  if (now >= pot.deadline.toNumber())
    return pot.members.every((m) => !m.contributed || m.refunded)
      ? "Refunded"
      : "Refunds available";
  return pot.fundedCount === pot.members.length
    ? "Awaiting approval"
    : "Collecting";
}
export function explorer(value: string, kind: "tx" | "address" = "tx") {
  return `https://explorer.solana.com/${kind}/${value}?${cluster === "localnet" ? `cluster=custom&customUrl=${encodeURIComponent(rpc)}` : "cluster=devnet"}`;
}
export async function assertNetwork() {
  if (!["devnet", "localnet"].includes(cluster))
    throw new Error("CrewPot MVP only supports Devnet and localnet.");
  const genesis = await connection.getGenesisHash();
  if (
    cluster === "devnet" &&
    genesis !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
  )
    throw new Error(
      "RPC is not Solana Devnet. Check your network configuration.",
    );
  if (
    cluster === "localnet" &&
    [
      "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
      "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
      "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
    ].includes(genesis)
  )
    throw new Error("Localnet configuration points to a public cluster.");
  const deployed = await connection.getAccountInfo(programId);
  if (!deployed?.executable)
    throw new Error("CrewPot is not deployed on this network yet.");
}
export async function chainTime() {
  const time = await connection.getBlockTime(await connection.getSlot());
  if (time === null)
    throw new Error("Unable to read network time. Please retry.");
  return time;
}
export async function readPot(address: string) {
  const pot = (await program().account.potAccount.fetch(
    new PublicKey(address),
  )) as Pot;
  if (!mintAddress || pot.mint.toBase58() !== mintAddress)
    throw new Error(
      "This pot does not use the configured Demo USDC mint. Its token is not supported by this interface.",
    );
  return pot;
}
export async function listPots(wallet: PublicKey): Promise<PotRecord[]> {
  const all = await program().account.potAccount.all();
  return all.filter(
    ({ account }) =>
      account.mint.toBase58() === mintAddress &&
      account.members.some((m) => m.wallet.equals(wallet)),
  ) as PotRecord[];
}
export type Action = "contribute" | "approve" | "release" | "refund";
export function availableAction(
  pot: Pot,
  wallet: PublicKey | null,
  now: number,
): Action | undefined {
  if (!wallet || pot.released) return undefined;
  if (pot.payoutAuthorized) return "release";
  const member = pot.members.find((m) => m.wallet.equals(wallet));
  if (now >= pot.deadline.toNumber())
    return member?.contributed && !member.refunded ? "refund" : undefined;
  if (member && !member.contributed) return "contribute";
  if (
    pot.fundedCount === pot.members.length &&
    member?.contributed &&
    !member.approved
  )
    return "approve";
  return undefined;
}
export async function actionTransaction(
  action: Action,
  address: PublicKey,
  pot: Pot,
  member: PublicKey,
) {
  const p = program();
  const mint = pot.mint;
  const vault = getAssociatedTokenAddressSync(mint, address, true);
  const tokenProgram = TOKEN_PROGRAM_ID;
  const tx = new Transaction();
  if (action === "contribute")
    tx.add(
      await p.methods
        .contribute()
        .accountsStrict({
          member,
          pot: address,
          mint,
          source: getAssociatedTokenAddressSync(mint, member),
          vault,
          tokenProgram,
        })
        .instruction(),
    );
  if (action === "approve")
    tx.add(
      await p.methods
        .approvePayout()
        .accountsStrict({ member, pot: address })
        .instruction(),
    );
  if (action === "release" || action === "refund") {
    const owner = action === "release" ? pot.recipient : member;
    const destination = getAssociatedTokenAddressSync(mint, owner, true);
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        member,
        destination,
        owner,
        mint,
      ),
    );
    tx.add(
      action === "release"
        ? await p.methods
            .releaseFunds()
            .accountsStrict({
              pot: address,
              mint,
              vault,
              destination,
              tokenProgram,
            })
            .instruction()
        : await p.methods
            .claimRefund()
            .accountsStrict({
              member,
              pot: address,
              mint,
              vault,
              destination,
              tokenProgram,
            })
            .instruction(),
    );
  }
  return tx;
}
export async function createTransaction(
  input: {
    title: string;
    description: string;
    amount: bigint;
    members: PublicKey[];
    recipient: PublicKey;
    threshold: number;
    deadline: number;
  },
  creator: PublicKey,
) {
  if (!mintAddress) throw new Error("Demo token mint is not configured yet.");
  const mint = new PublicKey(mintAddress);
  const info = await getMint(connection, mint);
  if (info.decimals !== 6 || info.freezeAuthority)
    throw new Error(
      "Demo mint must use six decimals and have no freeze authority.",
    );
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const potId = new BN(bytes, "le");
  const pot = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pot"),
      creator.toBuffer(),
      potId.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  )[0];
  const vault = getAssociatedTokenAddressSync(mint, pot, true);
  const ix = await program()
    .methods.createPot({
      potId,
      title: input.title,
      description: input.description,
      contributionAmount: new BN(input.amount.toString()),
      members: input.members,
      recipient: input.recipient,
      approvalThreshold: input.threshold,
      deadline: new BN(input.deadline),
    })
    .accountsStrict({
      creator,
      pot,
      mint,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return { address: pot.toBase58(), transaction: new Transaction().add(ix) };
}
export function friendlyError(error: unknown): string {
  const e = error as {
    message?: string;
    logs?: string[];
    error?: { errorMessage?: string };
  };
  if (e.error?.errorMessage) return e.error.errorMessage;
  const message = e.message || String(error);
  const logs = e.logs?.join(" ") || message;
  const code = logs.match(/Error Message: ([^.]+\.)/);
  if (code) return code[1];
  const hex = logs.match(/custom program error: 0x([\da-f]+)/i);
  if (hex) {
    const known = idl.errors.find((e) => e.code === parseInt(hex[1], 16));
    if (known) return known.msg;
  }
  if (/reject|cancel/i.test(message))
    return "You cancelled the wallet request. No transaction was submitted.";
  if (/insufficient funds|insufficient lamports|0x1\b/i.test(message))
    return "Insufficient balance. Check your dUSDC and SOL for network fees.";
  if (/429|rate limit/i.test(message))
    return "The RPC is busy. Wait a moment and refresh before trying again.";
  return message;
}
