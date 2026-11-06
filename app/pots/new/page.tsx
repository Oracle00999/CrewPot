"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import { createTransaction, friendlyError, mintAddress } from "@/lib/solana";
import { parseAmount, short, tokens } from "@/lib/format";
import { TransactionStatus, useTransaction } from "@/components/transaction";
export default function CreatePot() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([""]);
  const [amount, setAmount] = useState("10");
  const [recipient, setRecipient] = useState("");
  const [deadline, setDeadline] = useState("");
  const [threshold, setThreshold] = useState(2);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const { state, run, busy } = useTransaction();
  const count = members.length + 1;
  const minimum = Math.floor(count / 2) + 1;
  useEffect(() => {
    setThreshold((t) => Math.min(count, Math.max(minimum, t)));
    setReview(false);
  }, [count, minimum]);
  useEffect(() => {
    setReview(false);
  }, [publicKey]);
  let total = "—";
  try {
    total = tokens(parseAmount(amount) * BigInt(count));
  } catch {
    /* form not complete */
  }
  function validate() {
    if (!publicKey) throw new Error("Connect your wallet first.");
    if (!title.trim() || new TextEncoder().encode(title.trim()).length > 64)
      throw new Error("Use a title of 1–64 bytes.");
    if (new TextEncoder().encode(description.trim()).length > 280)
      throw new Error("Keep the purpose within 280 bytes.");
    const wallets = [
      publicKey,
      ...members.map((m) => {
        try {
          return new PublicKey(m.trim());
        } catch {
          throw new Error("Check each member’s Solana wallet address.");
        }
      }),
    ];
    if (new Set(wallets.map((w) => w.toBase58())).size !== wallets.length)
      throw new Error(
        "Each wallet must be unique. You are already included as the creator.",
      );
    const target = parseAmount(amount) * BigInt(count);
    if (target > 18_446_744_073_709_551_615n)
      throw new Error("The total is too large.");
    let selected: PublicKey;
    try {
      selected = new PublicKey(recipient.trim());
    } catch {
      throw new Error("Enter a valid recipient wallet.");
    }
    if (
      wallets.some((w) => w.equals(PublicKey.default)) ||
      selected.equals(PublicKey.default)
    )
      throw new Error("The system address cannot be a member or recipient.");
    const timestamp = Math.floor(new Date(deadline).getTime() / 1000);
    if (!Number.isFinite(timestamp) || timestamp <= Date.now() / 1000 + 60)
      throw new Error("Choose a deadline at least a minute in the future.");
    return {
      title: title.trim(),
      description: description.trim(),
      amount: parseAmount(amount),
      members: wallets,
      recipient: selected,
      threshold,
      deadline: timestamp,
    };
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const input = validate();
      if (!review) {
        setReview(true);
        return;
      }
      let address = "";
      const ok = await run(async () => {
        const built = await createTransaction(input, publicKey!);
        address = built.address;
        return built.transaction;
      }, `Create ${input.title} · ${total} dUSDC target`);
      if (ok) router.push(`/pots/${address}?created=1`);
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  return (
    <main id="main" className="container page-shell">
      <Link href="/dashboard" className="back-link">
        <ArrowLeft size={16} /> My pots
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            A SHARED GOAL STARTS WITH A CLEAR AGREEMENT
          </div>
          <h1>
            {review
              ? "Everyone on the same page."
              : "Make room for your next plan."}
          </h1>
          <p>
            {review
              ? "These rules become permanent when you create the pot."
              : "Set the rules once. Let your crew take it from here."}
          </p>
        </div>
      </div>
      {!publicKey ? (
        <div className="empty-state">
          <h2>First, bring your wallet.</h2>
          <p>Your wallet will be included as the first member.</p>
          <WalletMultiButton />
        </div>
      ) : (
        <form className="create-layout" onSubmit={submit}>
          <div className="panel form-panel">
            <div className="form-step">
              <span>01</span>
              <h2>The shared goal</h2>
            </div>
            <fieldset disabled={busy || review}>
              <label>
                Pot name
                <input
                  required
                  maxLength={64}
                  placeholder="e.g. Weekend Gaming Fund"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                What’s the plan?
                <textarea
                  maxLength={280}
                  placeholder="Tell your crew what you’re pooling for."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <div className="form-step">
                <span>02</span>
                <h2>The crew</h2>
              </div>
              <label>
                Your wallet <span className="muted">Creator · included</span>
                <input readOnly value={publicKey.toBase58()} />
              </label>
              {members.map((member, i) => (
                <label key={i}>
                  Member {i + 2}
                  <div className="input-with-action">
                    <input
                      required
                      placeholder="Solana wallet address"
                      value={member}
                      onChange={(e) =>
                        setMembers((m) =>
                          m.map((s, n) => (n === i ? e.target.value : s)),
                        )
                      }
                    />
                    {members.length > 1 && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove member ${i + 2}`}
                        onClick={() =>
                          setMembers((m) => m.filter((_, n) => n !== i))
                        }
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                </label>
              ))}
              {members.length < 5 && (
                <button
                  type="button"
                  className="text-link add-member"
                  onClick={() => setMembers((m) => [...m, ""])}
                >
                  <Plus size={17} /> Add another member
                </button>
              )}
              <div className="form-step">
                <span>03</span>
                <h2>The agreement</h2>
              </div>
              <div className="form-row">
                <label>
                  Each person contributes
                  <div className="input-suffix">
                    <input
                      required
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <span>dUSDC</span>
                  </div>
                </label>
                <label>
                  Approvals needed
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  >
                    {Array.from(
                      { length: count - minimum + 1 },
                      (_, i) => minimum + i,
                    ).map((n) => (
                      <option value={n} key={n}>
                        {n} of {count} members
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Funding & approval deadline{" "}
                <span className="muted">Your local time</span>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <label>
                Who receives the payout?
                <input
                  required
                  placeholder="Fixed representative’s Solana wallet"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() => setRecipient(publicKey.toBase58())}
              >
                Use my wallet
              </button>
            </fieldset>
            {recipient &&
              ![publicKey.toBase58(), ...members].includes(recipient) && (
                <div className="notice amber">
                  This recipient is outside your crew. Members should review
                  this address before contributing.
                </div>
              )}
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            <TransactionStatus state={state} />
            <div className="form-buttons">
              {review && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setReview(false)}
                >
                  Edit agreement
                </button>
              )}
              <button className="button" disabled={busy || !mintAddress}>
                {busy
                  ? "Transaction in progress…"
                  : review
                    ? "Confirm & create pot"
                    : "Review agreement"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <aside className="agreement-summary panel">
            <div className="eyebrow">YOUR POT, AT A GLANCE</div>
            <h2>{title || "Something good is coming."}</h2>
            <div className="summary-total">
              {total}
              <span>dUSDC total</span>
            </div>
            <dl>
              <div>
                <dt>Crew size</dt>
                <dd>{count} members</dd>
              </div>
              <div>
                <dt>Equal contribution</dt>
                <dd>{amount || "—"} dUSDC</dd>
              </div>
              <div>
                <dt>Collective approval</dt>
                <dd>
                  {threshold} of {count}
                </dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>{recipient ? short(recipient, 6) : "Choose a wallet"}</dd>
              </div>
              <div>
                <dt>CrewPot fee</dt>
                <dd>Zero</dd>
              </div>
            </dl>
            <div className="summary-rule">
              <ShieldCheck size={22} />
              <p>
                Membership, recipient, and contribution rules are fixed after
                creation.
              </p>
            </div>
            <div className="summary-rule">
              <LockKeyhole size={22} />
              <p>
                No quorum by the deadline? Contributors can claim their own
                deposits back.
              </p>
            </div>
            <p className="footnote">
              Demo USDC has no real monetary value. Network fees and account
              rent are paid separately in SOL.
            </p>
            {!mintAddress && (
              <div className="notice amber">
                Demo token setup is pending. Pot creation will be enabled once
                the mint is configured.
              </div>
            )}
          </aside>
        </form>
      )}
    </main>
  );
}
