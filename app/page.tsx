import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ShieldCheck,
  Users,
  Wallet,
  Gamepad2,
  Tent,
  Music2,
  Coffee,
  LockKeyhole,
} from "lucide-react";
import { BrandMark } from "@/components/brand";
export default function Home() {
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-mark" /> SMALL CREWS. BIG PLANS.
          </div>
          <h1>
            Your crew.
            <br />
            Your money.
            <br />
            <span>Your rules.</span>
          </h1>
          <p className="hero-description">
            Good things happen when you pool together.
            <br className="desktop-break" /> Fund a shared goal and release the
            money only
            <br className="desktop-break" /> when your crew agrees.
          </p>
          <div className="hero-buttons">
            <Link href="/pots/new" className="button">
              Create a pot <ArrowUpRight size={20} />
            </Link>
            <Link href="#how-it-works" className="text-link">
              See how it works <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck size={16} /> Your rules, enforced onchain
            </span>
            <span>No platform fees</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-star star-one">✳</span>
          <span className="art-star star-two">✳</span>
          <div className="floating-note">
            <span className="note-icon">
              <Users size={17} />
            </span>{" "}
            A shared goal. A shared say.
          </div>
          <div className="preview-card">
            <div className="preview-top">
              <span className="goal-icon">
                <Gamepad2 size={27} />
              </span>
              <span className="badge">
                The crew is all in <Check size={12} />
              </span>
            </div>
            <h2>Next-level game nights.</h2>
            <p>PS5 Crew Fund</p>
            <div className="preview-amount">
              <strong>
                500<span> dUSDC</span>
              </strong>
              <span>of 500 dUSDC</span>
            </div>
            <div className="progress">
              <span style={{ width: "100%" }} />
            </div>
            <div className="preview-meta">
              <span>5 of 5 friends contributed</span>
              <span>100%</span>
            </div>
            <div className="avatar-row">
              {["JD", "AK", "MO", "TN", "EZ"].map((a, i) => (
                <span className={`avatar avatar-${i}`} key={a}>
                  {a}
                  <i>
                    <Check size={9} />
                  </i>
                </span>
              ))}
              <span className="all-together">Everybody’s in.</span>
            </div>
            <div className="approval-preview">
              <span>
                <ShieldCheck size={20} />
                <strong>Approved by the crew</strong>
              </span>
              <p>3 of 3 required approvals · Ready to release</p>
            </div>
            <div className="preview-bottom">
              <LockKeyhole size={13} /> Held in a program-controlled vault
            </div>
          </div>
          <div className="floating-stamp">
            <BrandMark size={25} />
            <span>
              Less “trust me.”
              <br />
              <strong>More “we agree.”</strong>
            </span>
          </div>
          <p className="illustration-label">
            Illustrative example · Not a live pot
          </p>
        </div>
      </section>
      <div className="use-case-strip">
        <div className="container">
          <span>A little together goes a long way.</span>
          <span>
            <Gamepad2 /> Shared purchases
          </span>
          <span>
            <Tent /> Weekend plans
          </span>
          <span>
            <Music2 /> Community events
          </span>
          <span>
            <Coffee /> Team expenses
          </span>
        </div>
      </div>
      <section className="how container" id="how-it-works">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LESS AWKWARD. MORE TOGETHER.</div>
            <h2>
              From “we should”
              <br />
              to “we did.”
            </h2>
          </div>
          <p>
            No chasing payments. No one holding all the power.
            <br />
            Just a clear agreement your whole crew can see.
          </p>
        </div>
        <div className="steps">
          <article>
            <span className="step-number">01</span>
            <Users />
            <h3>Bring your crew.</h3>
            <p>
              Choose up to six wallets, an equal contribution, a deadline, and
              who receives the funds.
            </p>
          </article>
          <article>
            <span className="step-number">02</span>
            <Wallet />
            <h3>Fill the pot.</h3>
            <p>
              Everyone contributes their share. Your tokens stay in a dedicated
              onchain vault.
            </p>
          </article>
          <article>
            <span className="step-number">03</span>
            <ShieldCheck />
            <h3>Make the call. Together.</h3>
            <p>
              Once fully funded, the crew approves. A strict majority unlocks
              the agreed payout.
            </p>
          </article>
        </div>
      </section>
      <section className="safety container">
        <div className="safety-icon">
          <ShieldCheck size={48} />
        </div>
        <div>
          <div className="eyebrow">PLANS CHANGE. YOUR RULES DON’T.</div>
          <h2>Didn’t get there? Get your share back.</h2>
          <p>
            If funding or approval falls short before the deadline, each
            contributor can claim their own refund. No permission from the
            creator needed.
          </p>
        </div>
        <Link href="/pots/new" className="button light">
          Start something together <ArrowUpRight size={18} />
        </Link>
      </section>
      <section className="fine-print container">
        <span className="network">
          <i /> SOLANA DEVNET
        </span>
        <p>
          CrewPot is a hackathon prototype using Demo USDC (dUSDC), with no real
          monetary value. No CrewPot fees; network fees and account rent apply.
          The crew chooses its representative—CrewPot does not control spending
          after payout.
        </p>
      </section>
    </main>
  );
}
