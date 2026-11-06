"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, type ConfirmedSignatureInfo } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Clock3,
  Users,
  LockKeyhole,
} from "lucide-react";
import {
  actionTransaction,
  availableAction,
  assertNetwork,
  chainTime,
  cluster,
  connection,
  explorer,
  friendlyError,
  readPot,
  status,
  type Action,
  type Pot,
} from "@/lib/solana";
import { deadlineText, short, tokens } from "@/lib/format";
import { TransactionStatus, useTransaction } from "./transaction";
export function PotDetail({ address }: { address: string }) {
  const { publicKey } = useWallet();
  const [pot, setPot] = useState<Pot>();
  const [now, setNow] = useState(0);
  const [history, setHistory] = useState<ConfirmedSignatureInfo[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [sol, setSol] = useState<number | null>(null);
  const [vaultBalance, setVaultBalance] = useState<bigint | null>(null);
  const refresh = useCallback(async () => {
    try {
      await assertNetwork();
      const [p, time] = await Promise.all([readPot(address), chainTime()]);
      setPot(p);
      setNow(time);
      setError("");
      const vault = getAssociatedTokenAddressSync(
        p.mint,
        new PublicKey(address),
        true,
      );
      setVaultBalance((await getAccount(connection, vault)).amount);
      if (publicKey) {
        setSol(await connection.getBalance(publicKey));
        try {
          setBalance(
            (
              await getAccount(
                connection,
                getAssociatedTokenAddressSync(p.mint, publicKey),
              )
            ).amount,
          );
        } catch (e) {
          if ((e as Error).name === "TokenAccountNotFoundError") setBalance(0n);
          else setBalance(null);
        }
      } else {
        setBalance(null);
        setSol(null);
      }
      try {
        setHistory(
          await connection.getSignaturesForAddress(
            new PublicKey(address),
            { limit: 30 },
            "confirmed",
          ),
        );
        setHistoryError("");
      } catch {
        setHistoryError("Activity could not be loaded. Refresh to retry.");
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [address, publicKey]);
  useEffect(() => {
    setPot(undefined);
    setLoading(true);
    void refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);
  useEffect(() => {
    const tick = setInterval(() => setNow((n) => (n ? n + 1 : n)), 1000);
    return () => clearInterval(tick);
  }, []);
  const { state, run, busy } = useTransaction(refresh);
  const currentStatus = pot ? status(pot, now) : "Collecting";
  const member = publicKey
    ? pot?.members.find((m) => m.wallet.equals(publicKey))
    : undefined;
  const action: Action | undefined =
    pot && !error ? availableAction(pot, publicKey, now) : undefined;
  const labels = {
    contribute: "Contribute my share",
    approve: "Approve payout",
    release: "Release funds",
    refund: "Claim my refund",
  };
  async function act() {
    if (!action || !pot || !publicKey) return;
    const selected = action;
    await run(
      () => actionTransaction(selected, new PublicKey(address), pot, publicKey),
      `${labels[selected]} · ${selected === "approve" ? `${pot.approvalThreshold} approvals required` : `${tokens(selected === "release" ? pot.targetAmount : pot.contributionAmount)} dUSDC`} · ${cluster}`,
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Could not copy. Share this page’s URL from your browser.");
    }
  }
  return (
    <main id="main" className="container page-shell">
      <Link href="/dashboard" className="back-link">
        <ArrowLeft size={16} /> My pots
      </Link>
      {error && (
        <div className="notice error" role="alert">
          {error}{" "}
          <button className="text-link" onClick={refresh}>
            Retry
          </button>
        </div>
      )}
      {loading && (
        <div className="loading-state">
          Reading your crew’s agreement from Solana…
        </div>
      )}
      {pot && (
        <>
          <div className="page-heading detail-heading">
            <div>
              <span className="badge">{currentStatus}</span>
              <h1>{pot.title}</h1>
              <p>{pot.description}</p>
              <div className="detail-byline">
                Created by{" "}
                <a
                  href={explorer(pot.creator.toBase58(), "address")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {short(pot.creator.toBase58(), 6)}
                </a>
                <span>·</span>
                <span>
                  {cluster === "localnet" ? "Localnet" : "Solana Devnet"}
                </span>
              </div>
            </div>
            <div className="row">
              <button className="button secondary small" onClick={copy}>
                <Copy size={16} />
                {copied ? "Link copied" : "Share invite"}
              </button>
              <button
                className="icon-button"
                onClick={refresh}
                aria-label="Refresh pot"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>
          <div className="detail-layout">
            <div className="detail-main">
              <section className="panel funding-panel">
                <div className="panel-title">
                  <h2>A little from everyone.</h2>
                  <span className="muted">
                    <Users size={16} /> {pot.members.length} members
                  </span>
                </div>
                <div className="funding-total">
                  {tokens(pot.totalContributed)}
                  <span> / {tokens(pot.targetAmount)} dUSDC</span>
                </div>
                <div className="progress large">
                  <span
                    style={{
                      width: `${(pot.fundedCount / pot.members.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="funding-meta">
                  <span>
                    {pot.fundedCount} of {pot.members.length} contributed
                  </span>
                  <span>{tokens(pot.contributionAmount)} dUSDC each</span>
                </div>
                <div className="funding-bottom">
                  <span>
                    <Clock3 size={17} />
                    {deadlineText(pot.deadline.toNumber(), now)}
                  </span>
                  <span>
                    Vault balance:{" "}
                    {vaultBalance === null
                      ? "Unavailable"
                      : `${tokens(vaultBalance)} dUSDC`}
                  </span>
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>The crew</h2>
                  <span className="muted">Fixed membership</span>
                </div>
                <div className="member-table">
                  <div className="member-table-head">
                    <span>Member</span>
                    <span>Contribution</span>
                    <span>Approval</span>
                  </div>
                  {pot.members.map((m, i) => (
                    <div className="member-row" key={m.wallet.toBase58()}>
                      <div>
                        <span className={`avatar avatar-${i % 5}`}>
                          {m.wallet.toBase58().slice(0, 2)}
                        </span>
                        <a
                          href={explorer(m.wallet.toBase58(), "address")}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(m.wallet.toBase58())}
                          {publicKey?.equals(m.wallet) && <small>You</small>}
                        </a>
                      </div>
                      <span className={m.contributed ? "positive" : "muted"}>
                        {m.refunded ? (
                          "Refunded"
                        ) : m.contributed ? (
                          <>
                            <Check size={14} /> Paid
                          </>
                        ) : (
                          "Pending"
                        )}
                      </span>
                      <span className={m.approved ? "positive" : "muted"}>
                        {m.approved ? (
                          <>
                            <Check size={14} /> Approved
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>Onchain activity</h2>
                  <span className="muted">Latest 30 transactions</span>
                </div>
                {historyError && <p className="notice amber">{historyError}</p>}
                {!history.length && !historyError && (
                  <p className="muted">
                    No indexed transactions yet. Refresh shortly.
                  </p>
                )}
                {history.map((tx) => (
                  <a
                    className="activity-row"
                    href={explorer(tx.signature)}
                    key={tx.signature}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={`activity-dot ${tx.err ? "failed" : ""}`}>
                      <ArrowUpRight size={17} />
                    </span>
                    <div>
                      <strong>
                        {tx.err
                          ? "Failed transaction"
                          : "Confirmed transaction"}
                      </strong>
                      <p>{short(tx.signature, 10)}</p>
                    </div>
                    <span>
                      {tx.blockTime
                        ? new Date(tx.blockTime * 1000).toLocaleString()
                        : "Time pending"}
                    </span>
                    <ExternalLink size={15} />
                  </a>
                ))}
              </section>
            </div>
            <aside className="detail-aside">
              <section className="panel action-panel">
                <div className="eyebrow">YOUR CREW HAS THE SAY</div>
                <h2>
                  {pot.released
                    ? "Good things, done together."
                    : pot.payoutAuthorized
                      ? "Your crew authorized this payout."
                      : currentStatus === "Refunds available" ||
                          currentStatus === "Refunded"
                        ? "Plans changed. Your share is yours."
                        : pot.fundedCount === pot.members.length
                          ? "All in. Time to make the call."
                          : "A shared goal. Your part."}
                </h2>
                <p>
                  {pot.released
                    ? "The agreed amount was released to your representative."
                    : pot.payoutAuthorized
                      ? "Anyone can finalize the transfer to the fixed recipient—even after the deadline."
                      : now >= pot.deadline.toNumber()
                        ? "This pot did not meet the required funding and approval conditions before its deadline."
                        : "Funds stay in the vault until the crew meets its agreement."}
                </p>
                <div className="approval-counter">
                  <strong>
                    {pot.approvalCount}
                    <span> / {pot.approvalThreshold}</span>
                  </strong>
                  <span>required approvals</span>
                </div>
                {!publicKey ? (
                  <WalletMultiButton />
                ) : action ? (
                  <>
                    <p className="action-review">
                      {action === "approve"
                        ? `Approve the release of ${tokens(pot.targetAmount)} dUSDC to ${short(pot.recipient.toBase58(), 6)}. Approvals cannot be revoked.`
                        : `${tokens(action === "release" ? pot.targetAmount : pot.contributionAmount)} dUSDC ${action === "release" ? `to ${short(pot.recipient.toBase58(), 6)}` : action === "refund" ? "back to your wallet" : "into this pot’s vault"}.`}
                    </p>
                    <button
                      className="button full"
                      onClick={act}
                      disabled={
                        busy ||
                        (action === "contribute" &&
                          balance !== null &&
                          balance < BigInt(pot.contributionAmount.toString()))
                      }
                    >
                      {busy ? "Transaction in progress…" : labels[action]}
                      <ArrowUpRight size={18} />
                    </button>
                  </>
                ) : (
                  <div className="notice">
                    {member?.refunded
                      ? "You’ve claimed your refund."
                      : pot.released
                        ? "This round is complete."
                        : !member
                          ? "You can view this pot, but your wallet is not an invited member."
                          : member.approved
                            ? "Your approval is recorded. Waiting for the crew."
                            : member.contributed
                              ? "Your share is in. Waiting for the crew."
                              : "No action is available for this wallet."}
                  </div>
                )}
                {publicKey && (
                  <p className="footnote">
                    Your balance:{" "}
                    {balance === null
                      ? "Unavailable"
                      : `${tokens(balance)} dUSDC`}{" "}
                    · {sol === null ? "—" : (sol / 1e9).toFixed(4)} SOL
                  </p>
                )}
                {action === "contribute" &&
                  balance !== null &&
                  balance < BigInt(pot.contributionAmount.toString()) && (
                    <p className="notice amber">
                      You need more demo tokens before contributing.
                    </p>
                  )}
                <TransactionStatus state={state} />
              </section>
              <section className="panel recipient-panel">
                <div className="panel-title">
                  <h2>
                    <Wallet size={19} /> The representative
                  </h2>
                  <LockKeyhole size={15} />
                </div>
                <a
                  className="wallet-address"
                  href={explorer(pot.recipient.toBase58(), "address")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {pot.recipient.toBase58()} <ExternalLink size={13} />
                </a>
                <p className="footnote">
                  Fixed at creation.{" "}
                  {pot.members.some((m) => m.wallet.equals(pot.recipient))
                    ? "A member of this crew."
                    : "This recipient is outside the crew."}{" "}
                  CrewPot does not control their spending after payout.
                </p>
              </section>
              <section className="panel rules-panel">
                <h2>
                  <ShieldCheck size={19} /> The agreement
                </h2>
                <dl>
                  <div>
                    <dt>Approval rule</dt>
                    <dd>
                      {pot.approvalThreshold} of {pot.members.length}
                    </dd>
                  </div>
                  <div>
                    <dt>Deadline</dt>
                    <dd>
                      {new Date(
                        pot.deadline.toNumber() * 1000,
                      ).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt>CrewPot fee</dt>
                    <dd>Zero</dd>
                  </div>
                </dl>
                <a
                  className="text-link"
                  href={explorer(address, "address")}
                  target="_blank"
                  rel="noreferrer"
                >
                  View pot account <ExternalLink size={14} />
                </a>
                <p className="footnote">
                  Demo USDC (dUSDC) · No real monetary value. Network fees and
                  account rent apply.
                </p>
              </section>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
