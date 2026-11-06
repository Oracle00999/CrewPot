"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand";
import { cluster } from "@/lib/solana";
const WalletButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  {
    ssr: false,
    loading: () => (
      <button className="button small" disabled>
        Connect wallet
      </button>
    ),
  },
);
export function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandLogo />
        <nav aria-label="Main navigation">
          <Link
            className={path === "/dashboard" ? "active" : ""}
            href="/dashboard"
          >
            My pots
          </Link>
          <Link href="/#how-it-works">How it works</Link>
        </nav>
        <div className="header-actions">
          <span className="network">
            <i />
            {cluster === "localnet" ? "Localnet" : "Devnet"}
          </span>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
