import Link from "next/link";
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="10" r="5" fill="currentColor" />
      <circle cx="10" cy="15" r="4" fill="#A3E635" />
      <circle cx="38" cy="15" r="4" fill="#5EEAD4" />
      <path
        d="M17 25v-3a7 7 0 0 1 14 0v3M4 27c2 11 9 16 20 16s18-5 20-16H4Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function BrandLogo() {
  return (
    <Link className="brand" href="/" aria-label="CrewPot home">
      <BrandMark />
      <span>
        CrewPot<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
