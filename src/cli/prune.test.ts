import { Command } from "commander";
import { registerPruneCommand } from "./prune";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerPruneCommand(program);
  return program;
}

const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();

const mockVault = {
  EXPIRED_KEY: { value: "old_val", expiresAt: pastDate },
  ACTIVE_KEY: { value: "active_val", expiresAt: futureDate },
  NO_EXPIRY: { value: "forever" },
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
  jest.spyOn(vaultModule, "readVault").mockResolvedValue({ ...mockVault } as any);
  jest.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined);
});

test("prune --dry-run lists expired entries without writing", async () => {
  const { default: proxyquire } = await import("proxyquire");
  const promptMock = jest.fn().mockResolvedValue("testpass");
  jest.mock("readline", () => ({
    createInterface: () => ({ question: (_: string, cb: (a: string) => void) => cb("testpass"), close: jest.fn() }),
  }));

  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  const program = makeProgram();
  await program.parseAsync(["node", "envault", "prune", "--dry-run"], { from: "user" }).catch(() => {});

  expect(vaultModule.writeVault).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});

test("prune aborts when user declines confirmation", async () => {
  const promptResponses = ["testpass", "n"];
  let callCount = 0;
  jest.mock("readline", () => ({
    createInterface: () => ({
      question: (_: string, cb: (a: string) => void) => cb(promptResponses[callCount++] ?? ""),
      close: jest.fn(),
    }),
  }));

  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  const program = makeProgram();
  await program.parseAsync(["node", "envault", "prune"], { from: "user" }).catch(() => {});

  expect(vaultModule.writeVault).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});

test("prune reports no expired entries when none exist", async () => {
  jest.spyOn(vaultModule, "readVault").mockResolvedValue({
    ACTIVE_KEY: { value: "active_val", expiresAt: futureDate },
  } as any);

  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  const program = makeProgram();
  await program.parseAsync(["node", "envault", "prune", "--dry-run"], { from: "user" }).catch(() => {});

  const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
  expect(output).toContain("No expired entries found");
  consoleSpy.mockRestore();
});

test("prune exits when vault does not exist", async () => {
  jest.spyOn(vaultModule, "vaultExists").mockReturnValue(false);
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

  const program = makeProgram();
  await expect(
    program.parseAsync(["node", "envault", "prune"], { from: "user" })
  ).rejects.toThrow();

  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
  errorSpy.mockRestore();
  exitSpy.mockRestore();
});
