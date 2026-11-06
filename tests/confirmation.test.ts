import { afterEach, expect, it, vi } from "vitest";
import { confirmByPolling } from "../lib/confirmation";
const strategy = {
  signature: "test-signature",
  blockhash: "test-blockhash",
  lastValidBlockHeight: 100,
};
const response = (
  confirmationStatus: "processed" | "confirmed" | "finalized",
  err = null as unknown,
) => ({ context: { slot: 1 }, value: [{ confirmationStatus, err }] });
afterEach(() => vi.useRealTimers());
it("confirms a transaction using HTTP without a websocket", async () => {
  const connection = {
    getSignatureStatuses: vi.fn().mockResolvedValue(response("confirmed")),
    getBlockHeight: vi.fn(),
  };
  expect((await confirmByPolling(connection, strategy)).value.err).toBeNull();
  expect(connection.getBlockHeight).not.toHaveBeenCalled();
});
it("waits for confirmation rather than treating processed as success", async () => {
  vi.useFakeTimers();
  const connection = {
    getSignatureStatuses: vi
      .fn()
      .mockResolvedValueOnce(response("processed"))
      .mockResolvedValue(response("confirmed")),
    getBlockHeight: vi.fn(),
  };
  const pending = confirmByPolling(connection, strategy);
  await vi.advanceTimersByTimeAsync(1500);
  await expect(pending).resolves.toMatchObject({ value: { err: null } });
  expect(connection.getSignatureStatuses).toHaveBeenCalledTimes(2);
});
it("preserves confirmed transaction errors", async () => {
  const error = { InstructionError: [0, "Custom"] };
  const connection = {
    getSignatureStatuses: vi
      .fn()
      .mockResolvedValue(response("confirmed", error)),
    getBlockHeight: vi.fn(),
  };
  expect((await confirmByPolling(connection, strategy)).value.err).toEqual(
    error,
  );
});
it("rejects expired missing signatures only after a second status lookup", async () => {
  const connection = {
    getSignatureStatuses: vi
      .fn()
      .mockResolvedValue({ context: { slot: 1 }, value: [null] }),
    getBlockHeight: vi.fn().mockResolvedValue(101),
  };
  await expect(confirmByPolling(connection, strategy)).rejects.toThrow(
    "block height exceeded",
  );
  expect(connection.getSignatureStatuses).toHaveBeenCalledTimes(2);
});
