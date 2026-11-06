import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "CrewPot — Your crew. Your money. Your rules.",
    template: "%s | CrewPot",
  },
  description:
    "Pool funds for a shared goal. Agree on the rules. Release money only when your crew approves. Built on Solana Devnet.",
  icons: { icon: "/branding/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header />
          {children}
          <footer>
            <span>CrewPot © 2026</span>
            <span>Built together. Secured on Solana.</span>
            <span>Demo USDC (dUSDC) · No real monetary value</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
