import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  assertDemoNetwork,
  connection,
  demoDir,
  deployerPath,
  loadKey,
  network,
} from "./shared";
import idl from "../lib/contracts/crewpot.json";

async function main() {
  await assertDemoNetwork();
  const deployer = loadKey(deployerPath, true);
  console.log(
    `Network: ${network}; deployer: ${deployer.publicKey.toBase58()}`,
  );
  if ((await connection.getBalance(deployer.publicKey)) < LAMPORTS_PER_SOL) {
    try {
      const signature = await connection.requestAirdrop(
        deployer.publicKey,
        2 * LAMPORTS_PER_SOL,
      );
      const block = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...block }, "confirmed");
    } catch {
      throw new Error(
        `Devnet funding is needed. Fund ${deployer.publicKey.toBase58()} using https://faucet.solana.com then rerun. No key material is printed.`,
      );
    }
  }
  mkdirSync(demoDir, { recursive: true, mode: 0o700 });
  const mintKey = loadKey(path.join(demoDir, "mint-keypair.json"), true);
  const authority = loadKey(path.join(demoDir, "mint-authority.json"), true);
  if (!(await connection.getAccountInfo(mintKey.publicKey)))
    await createMint(
      connection,
      deployer,
      authority.publicKey,
      null,
      6,
      mintKey,
    );
  const mint = await getMint(connection, mintKey.publicKey);
  if (
    mint.decimals !== 6 ||
    mint.freezeAuthority ||
    !mint.mintAuthority?.equals(authority.publicKey)
  )
    throw new Error(
      "Existing demo mint does not match its expected configuration.",
    );
  const members = Array.from({ length: 3 }, (_, i) =>
    loadKey(path.join(demoDir, `member-${i + 1}.json`), true),
  );
  for (const member of members) {
    if (
      (await connection.getBalance(member.publicKey)) <
      0.03 * LAMPORTS_PER_SOL
    )
      await sendAndConfirmTransaction(
        connection,
        new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: deployer.publicKey,
            toPubkey: member.publicKey,
            lamports: 0.08 * LAMPORTS_PER_SOL,
          }),
        ),
        [deployer],
      );
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      deployer,
      mintKey.publicKey,
      member.publicKey,
    );
    const target = 1_000_000_000n;
    if (ata.amount < target)
      await mintTo(
        connection,
        deployer,
        mintKey.publicKey,
        ata.address,
        authority,
        target - ata.amount,
      );
  }
  const manifest = {
    network,
    programId: idl.address,
    mint: mintKey.publicKey.toBase58(),
    members: members.map((m) => m.publicKey.toBase58()),
    recipient: members[0].publicKey.toBase58(),
  };
  writeFileSync(
    path.join(demoDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(JSON.stringify(manifest, null, 2));
  console.log(
    `Private demo keys are outside the repository in ${demoDir}. Never put them in a browser bundle or commit them.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
