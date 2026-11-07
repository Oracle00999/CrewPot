import {
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

/** MWA serializes before signing: use v0 when supported so unsigned transport is valid. */
export function prepareWalletTransaction(
  transaction: Transaction,
  payer: PublicKey,
  blockhash: string,
  supportsV0: boolean,
): Transaction | VersionedTransaction {
  transaction.feePayer = payer;
  transaction.recentBlockhash = blockhash;
  const message = transaction.compileMessage();
  // Every CrewPot action requires only the connected member's signature.
  // Catch stale account selections before opening a wallet request.
  if (
    message.header.numRequiredSignatures !== 1 ||
    !message.accountKeys[0].equals(payer)
  ) {
    throw new Error(
      "This transaction requires a different wallet. Reconnect the member wallet and try again.",
    );
  }
  if (!supportsV0) return transaction;
  return new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: transaction.instructions,
    }).compileToV0Message(),
  );
}

export function serializeSignedWalletTransaction(
  transaction: Transaction | VersionedTransaction,
): Uint8Array {
  if (transaction instanceof Transaction) return transaction.serialize();
  if (
    transaction.signatures.length !== transaction.message.header.numRequiredSignatures ||
    transaction.signatures.some((signature) => signature.every((byte) => byte === 0))
  ) {
    throw new Error(
      "The wallet did not sign this transaction. Reconnect the member wallet and approve the request. Nothing was submitted.",
    );
  }
  // RPC preflight still verifies the actual cryptographic signature before execution.
  return transaction.serialize();
}
