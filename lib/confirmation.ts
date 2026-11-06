import {
  Connection,
  TransactionExpiredBlockheightExceededError,
  TransactionExpiredTimeoutError,
  type Commitment,
  type TransactionConfirmationStrategy,
  type RpcResponseAndContext,
  type SignatureResult,
} from "@solana/web3.js";

/** Confirm over HTTP when an RPC's WebSocket service is unavailable. Never resubmits. */
export async function confirmByPolling(
  connection: Pick<Connection, "getSignatureStatuses" | "getBlockHeight">,
  strategy: TransactionConfirmationStrategy | string,
  commitment: Commitment = "confirmed",
): Promise<RpcResponseAndContext<SignatureResult>> {
  const signature =
    typeof strategy === "string" ? strategy : strategy.signature;
  const started = Date.now();
  const finalized =
    commitment === "finalized" || commitment === "root" || commitment === "max";
  while (Date.now() - started < 90_000) {
    const response = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = response.value[0];
    if (
      status &&
      (status.confirmationStatus === "finalized" ||
        (!finalized && status.confirmationStatus === "confirmed"))
    ) {
      return { context: response.context, value: { err: status.err } };
    }
    if (
      !status &&
      typeof strategy !== "string" &&
      "lastValidBlockHeight" in strategy &&
      (await connection.getBlockHeight("confirmed")) >
        strategy.lastValidBlockHeight
    ) {
      // One final status lookup closes the race between the two RPC calls.
      const final = await connection.getSignatureStatuses([signature], {
        searchTransactionHistory: true,
      });
      if (!final.value[0])
        throw new TransactionExpiredBlockheightExceededError(signature);
      continue;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new TransactionExpiredTimeoutError(signature, 90);
}

export class HttpConfirmationConnection extends Connection {
  override confirmTransaction(
    strategy: TransactionConfirmationStrategy | string,
    commitment?: Commitment,
  ) {
    return confirmByPolling(
      this,
      strategy,
      commitment ?? this.commitment ?? "confirmed",
    );
  }
}
