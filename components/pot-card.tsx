import Link from "next/link";
import { ArrowUpRight, Users, Clock3, Layers3 } from "lucide-react";
import { status, type PotRecord } from "@/lib/solana";
import { deadlineText, tokens } from "@/lib/format";
export function PotCard({ record, now }: { record: PotRecord; now: number }) {
  const pot = record.account;
  const state = status(pot, now);
  const percent = Math.round((pot.fundedCount / pot.members.length) * 100);
  return (
    <Link href={`/pots/${record.publicKey.toBase58()}`} className="pot-card">
      <div className="card-top">
        <span className="goal-icon">
          <Layers3 size={23} />
        </span>
        <span
          className={`badge ${state === "Refunds available" ? "amber" : ""}`}
        >
          {state}
        </span>
      </div>
      <h3>{pot.title}</h3>
      <p className="clamp">
        {pot.description || "A shared goal for your crew."}
      </p>
      <div className="card-amount">
        <strong>
          {tokens(pot.totalContributed)} <small>dUSDC</small>
        </strong>
        <span>of {tokens(pot.targetAmount)}</span>
      </div>
      <div className="progress">
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="card-meta">
        <span>
          <Users size={14} />
          {pot.fundedCount}/{pot.members.length} contributed
        </span>
        <span>
          <Clock3 size={14} />
          {deadlineText(pot.deadline.toNumber(), now)}
        </span>
      </div>
      <div className="card-footer">
        <span>
          {pot.approvalCount} of {pot.approvalThreshold} approvals
        </span>
        <ArrowUpRight size={18} />
      </div>
    </Link>
  );
}
