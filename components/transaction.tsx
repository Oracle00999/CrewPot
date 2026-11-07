"use client";
import { useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { confirmByPolling } from "@/lib/confirmation";
import {
  prepareWalletTransaction,
  serializeSignedWalletTransaction,
} from "@/lib/wallet-transaction";
import {
  assertNetwork,
  connection,
  explorer,
  friendlyError,
} from "@/lib/solana";
import {
  ExternalLink,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
export type TxState = {
  phase: string;
  signature?: string;
  error?: string;
  detail?: string;
};
export function useTransaction(onConfirmed?: () => void | Promise<void>) {
  const wallet = useWallet();
  const currentWallet = useRef(wallet);
  currentWallet.current = wallet;
  const [state, setState] = useState<TxState>({ phase: "idle" });
  const busy = [
    "Preparing",
    "Awaiting wallet confirmation",
    "Submitted",
    "Confirming",
  ].includes(state.phase);
  async function run(
    build: () => Promise<Transaction>,
    detail: string,
  ): Promise<boolean> {
    let signature: string | undefined;
    try {
      if (!wallet.publicKey || !wallet.signTransaction)
        throw new Error("Connect a compatible wallet first.");
      const member = wallet.publicKey;
      setState({ phase: "Preparing", detail });
      await assertNetwork();
      const tx = await build();
      const latest = await connection.getLatestBlockhash("confirmed");
      if (!currentWallet.current.publicKey?.equals(member))
        throw new Error("Your connected wallet changed. Refresh the pot and try again.");
      const prepared = prepareWalletTransaction(
        tx,
        member,
        latest.blockhash,
        wallet.wallet?.adapter.supportedTransactionVersions?.has(0) ?? false,
      );
      setState({ phase: "Awaiting wallet confirmation", detail });
      const signed = await wallet.signTransaction(prepared);
      signature = await connection.sendRawTransaction(serializeSignedWalletTransaction(signed), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      setState({ phase: "Submitted", signature, detail });
      setState({ phase: "Confirming", signature, detail });
      const confirmed = await confirmByPolling(
        connection,
        { signature, ...latest },
        "confirmed",
      );
      if (confirmed.value.err) {
        setState({
          phase: "Failed",
          signature,
          detail,
          error: `The network rejected this transaction: ${JSON.stringify(confirmed.value.err)}`,
        });
        return false;
      }
      setState({ phase: "Confirmed", signature, detail });
      // A failed refresh must never reclassify a confirmed transfer as failed.
      try {
        await onConfirmed?.();
      } catch {
        /* caller exposes refresh errors separately */
      }
      return true;
    } catch (error) {
      setState({
        phase: signature ? "Confirmation unresolved" : "Failed",
        signature,
        detail,
        error: friendlyError(error),
      });
      return false;
    }
  }
  return { state, run, busy };
}
export function TransactionStatus({ state }: { state: TxState }) {
  if (state.phase === "idle") return null;
  const Icon =
    state.phase === "Confirmed"
      ? CheckCircle2
      : state.error
        ? AlertCircle
        : LoaderCircle;
  return (
    <div
      className={`transaction-notice ${state.error ? "error" : ""}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        size={21}
        className={!state.error && state.phase !== "Confirmed" ? "spin" : ""}
      />
      <div>
        <strong>{state.phase}</strong>
        <p>{state.error || state.detail}</p>
        {state.signature && (
          <>
            <a
              href={explorer(state.signature)}
              target="_blank"
              rel="noreferrer"
            >
              View transaction on Explorer <ExternalLink size={13} />
            </a>
            <code>{state.signature}</code>
          </>
        )}
        {state.phase === "Confirmation unresolved" && (
          <p>
            Check Explorer and refresh the pot before retrying. The transaction
            may still confirm.
          </p>
        )}
      </div>
    </div>
  );
}
