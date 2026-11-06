export const short = (s: string, n = 4) => `${s.slice(0, n)}…${s.slice(-n)}`;
export function parseAmount(value: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(value))
    throw new Error("Enter a positive amount with at most six decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  if (amount <= 0n || amount > 18_446_744_073_709_551_615n)
    throw new Error("Amount is outside the supported range.");
  return amount;
}
export function tokens(
  value: bigint | string | { toString(): string },
): string {
  const amount = BigInt(value.toString());
  const whole = (amount / 1_000_000n).toLocaleString("en-US");
  const fraction = (amount % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
export function deadlineText(timestamp: number, now = Date.now() / 1000) {
  const seconds = timestamp - now;
  if (seconds <= 0) return "Deadline reached";
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m left`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m left`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h left`;
}
