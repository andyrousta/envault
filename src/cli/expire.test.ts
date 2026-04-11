import { Command } from "commander";
import { registerExpireCommand } from "./expire";
import * as vaultModule from "../vault";

jest.mock("../vault");
jest.mock("readline", () => ({
  createInterface: () => ({
    question: (_: string, cb: (a: string) => void) => cb("masterpass"),
    close: jest.fn(),
  }),
}));

const mockReadVault = vaultModule.readVault as jest.Mock;
const mockWriteVault = vaultModule.writeVault as jest.Mock;

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerExpireCommand(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteVault.mockResolvedValue(undefined);
});

test("sets expiry on a key", async () => {
  const entry = { key: "API_KEY", value: "secret" };
  mockReadVault.mockResolvedValue({ entries: [entry] });
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  await makeProgram().parseAsync(["node", "envault", "expire", "API_KEY", "--at", "2099-01-01"]);

  expect((entry as any).expiresAt).toBe(new Date("2099-01-01").toISOString());
  expect(mockWriteVault).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("set to"));
  consoleSpy.mockRestore();
});

test("clears expiry from a key", async () => {
  const entry = { key: "API_KEY", value: "secret", expiresAt: "2020-01-01T00:00:00.000Z" };
  mockReadVault.mockResolvedValue({ entries: [entry] });
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  await makeProgram().parseAsync(["node", "envault", "expire", "API_KEY", "--clear"]);

  expect((entry as any).expiresAt).toBeUndefined();
  expect(mockWriteVault).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("cleared"));
  consoleSpy.mockRestore();
});

test("checks if a key is expired", async () => {
  const entry = { key: "OLD_KEY", value: "val", expiresAt: "2000-01-01T00:00:00.000Z" };
  mockReadVault.mockResolvedValue({ entries: [entry] });
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  await makeProgram().parseAsync(["node", "envault", "expire", "OLD_KEY", "--check"]);

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("expired on"));
  expect(mockWriteVault).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});

test("errors on missing key", async () => {
  mockReadVault.mockResolvedValue({ entries: [] });
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

  await expect(
    makeProgram().parseAsync(["node", "envault", "expire", "MISSING", "--at", "2099-01-01"])
  ).rejects.toThrow("exit");

  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
  errorSpy.mockRestore();
  exitSpy.mockRestore();
});
