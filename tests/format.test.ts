import { describe, expect, it } from "vitest";
import { parseAmount, tokens } from "../lib/format";
describe("token amounts", () => {
  it("parses exact base units without floating point", () => {
    expect(parseAmount("9007199254.740993")).toBe(9007199254740993n);
    expect(parseAmount("0.000001")).toBe(1n);
  });
  it.each([
    "0",
    "-1",
    "1e6",
    "1.0000001",
    "NaN",
    "",
    " 10 ",
    "18446744073709.551616",
  ])("rejects invalid amount %s", (value) =>
    expect(() => parseAmount(value)).toThrow(),
  );
  it("formats all six decimals accurately", () => {
    expect(tokens("9007199254740993")).toBe("9,007,199,254.740993");
    expect(tokens("10000000")).toBe("10");
  });
});
