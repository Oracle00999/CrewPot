import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { Connection, Keypair } from "@solana/web3.js";
export const endpoint =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  endpoint,
);
export const network = local ? "localnet" : "devnet";
export const demoDir =
  process.env.CREWPOT_DEMO_DIR ||
  path.join(homedir(), ".config", "solana", "crewpot-demo", network);
export const deployerPath =
  process.env.CREWPOT_KEYPAIR_PATH ||
  path.join(homedir(), ".config", "solana", "crewpot-deployer.json");
export const connection = new Connection(endpoint, "confirmed");
export function loadKey(filename: string, create = false): Keypair {
  if (!existsSync(filename)) {
    if (!create)
      throw new Error(`Missing keypair: ${filename}. Run demo:setup first.`);
    mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
    const key = Keypair.generate();
    writeFileSync(filename, JSON.stringify(Array.from(key.secretKey)), {
      mode: 0o600,
      flag: "wx",
    });
  }
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(filename, "utf8"))),
  );
}
export async function assertDemoNetwork() {
  const hash = await connection.getGenesisHash();
  if (!local && hash !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG")
    throw new Error("Refusing to transact outside Solana Devnet or localhost.");
  if (
    local &&
    [
      "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
      "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
    ].includes(hash)
  )
    throw new Error("Public production/test cluster is not allowed.");
}
export function manifest() {
  return JSON.parse(
    readFileSync(path.join(demoDir, "manifest.json"), "utf8"),
  ) as {
    mint: string;
    members: string[];
    recipient: string;
    programId: string;
    network: string;
  };
}
