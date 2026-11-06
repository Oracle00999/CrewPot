"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowUpRight, Layers3, RefreshCw, Search, Wallet } from "lucide-react";
import {
  assertNetwork,
  chainTime,
  friendlyError,
  listPots,
  status,
  type PotRecord,
} from "@/lib/solana";
import { PotCard } from "@/components/pot-card";
import { short } from "@/lib/format";
export default function Dashboard() {
  const { publicKey } = useWallet();
  const [records, setRecords] = useState<PotRecord[]>([]);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All pots");
  const [query, setQuery] = useState("");
  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      await assertNetwork();
      const [pots, time] = await Promise.all([
        listPots(publicKey),
        chainTime(),
      ]);
      setRecords(pots.reverse());
      setNow(time);
      setError("");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [publicKey]);
  useEffect(() => {
    setRecords([]);
    setError("");
    void refresh();
    const interval = setInterval(refresh, 20_000);
    return () => clearInterval(interval);
  }, [refresh]);
  const visible = !publicKey
    ? []
    : records.filter(
        (r) =>
          r.account.title.toLowerCase().includes(query.toLowerCase()) &&
          (filter === "All pots" ||
            (filter === "Created by me"
              ? r.account.creator.equals(publicKey!)
              : filter === "Completed"
                ? ["Completed", "Refunded"].includes(status(r.account, now))
                : !["Completed", "Refunded"].includes(status(r.account, now)))),
      );
  return (
    <main id="main" className="container page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR LITTLE CORNER OF TOGETHER</div>
          <h1>
            My pots<span className="brand-dot">.</span>
          </h1>
          <p>
            {publicKey
              ? `Welcome back, ${short(publicKey.toBase58())}. Let’s make good things happen.`
              : "Connect your wallet to find your crew’s shared goals."}
          </p>
        </div>
        <Link href="/pots/new" className="button">
          Create a pot <ArrowUpRight size={19} />
        </Link>
      </div>
      {!publicKey ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Wallet size={35} />
          </div>
          <h2>Your crew starts here.</h2>
          <p>
            Connect your Solana wallet to see pots you’ve created or joined.
            <br />
            Connecting never grants access to your funds.
          </p>
          <WalletMultiButton />
        </div>
      ) : (
        <>
          <div className="stats">
            <div>
              <span>Total pots</span>
              <strong>{records.length}</strong>
            </div>
            <div>
              <span>In progress</span>
              <strong>
                {
                  records.filter(
                    (r) =>
                      !["Completed", "Refunded"].includes(
                        status(r.account, now),
                      ),
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Ready for payout</span>
              <strong>
                {
                  records.filter(
                    (r) => r.account.payoutAuthorized && !r.account.released,
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Refunds to claim</span>
              <strong>
                {
                  records.filter(
                    (r) =>
                      status(r.account, now) === "Refunds available" &&
                      r.account.members.some(
                        (m) =>
                          m.wallet.equals(publicKey) &&
                          m.contributed &&
                          !m.refunded,
                      ),
                  ).length
                }
              </strong>
            </div>
          </div>
          <div className="list-toolbar">
            <div className="tabs" aria-label="Filter pots">
              {["All pots", "In progress", "Created by me", "Completed"].map(
                (f) => (
                  <button
                    className={filter === f ? "selected" : ""}
                    onClick={() => setFilter(f)}
                    key={f}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
            <div className="search">
              <Search size={17} />
              <input
                aria-label="Search pots"
                placeholder="Find a pot…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="icon-button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh pots"
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}{" "}
              <button className="text-link" onClick={refresh}>
                Retry
              </button>
            </div>
          )}
          {loading && !records.length && (
            <div className="loading-state">Reading your pots from Solana…</div>
          )}
          {!loading && !error && !visible.length && (
            <div className="empty-state">
              <div className="empty-icon">
                <Layers3 size={35} />
              </div>
              <h2>
                {records.length
                  ? "No matching pots."
                  : "Every good plan starts somewhere."}
              </h2>
              <p>
                {records.length
                  ? "Try a different search or filter."
                  : "Create your first pot, or open an invite link from your crew."}
              </p>
              <Link className="button" href="/pots/new">
                Create your first pot <ArrowUpRight size={18} />
              </Link>
            </div>
          )}
          <div className="pot-grid">
            {visible.map((record) => (
              <PotCard
                key={record.publicKey.toBase58()}
                record={record}
                now={now}
              />
            ))}
          </div>
          <p className="muted footnote">
            Pots are read from the program’s accounts. Your invite links always
            open directly.
          </p>
        </>
      )}
    </main>
  );
}
