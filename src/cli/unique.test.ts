import { Command } from "commander";
import { registerUniqueCommand } from "./unique";
import * as vaultFile from "../vault/vaultFile";
import * as crypto from "../crypto";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerUniqueCommand(program);
  return program;
}

const mockEntries = {
  API_KEY: { value: "enc_unique_1" },
  DB_URL: { value: "enc_shared" },
  REDIS_URL: { value: "enc_shared" },
  SECRET: { value: "enc_unique_2" },
};

const decryptMap: Record<string, string> = {
  enc_unique_1: "abc123",
  enc_shared: "same_value",
  enc_unique_2: "xyz789",
};

beforeEach(() => {
  jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
  jest.spyOn(vaultFile, "readVault").mockReturnValue(mockEntries as any);
  jest.spyOn(crypto, "decrypt").mockImplementation(async (val: string) => decryptMap[val] ?? val);
  jest.spyOn(require("readline"), "createInterface").mockReturnValue({
    question: (_: string, cb: (a: string) => void) => cb("password"),
    close: jest.fn(),
  });
});

afterEach(() => jest.restoreAllMocks());

describe("unique command", () => {
  it("prints only keys with unique values", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "unique"]);
    const output = spy.mock.calls.flat().join("\n");
    expect(output).toContain("API_KEY");
    expect(output).toContain("SECRET");
    expect(output).not.toContain("DB_URL");
    expect(output).not.toContain("REDIS_URL");
    spy.mockRestore();
  });

  it("outputs JSON when --json flag is used", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "unique", "--json"]);
    const output = spy.mock.calls.flat().join("\n");
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toContain("API_KEY");
    expect(parsed).toContain("SECRET");
    spy.mockRestore();
  });

  it("exits with error if vault does not exist", async () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(makeProgram().parseAsync(["node", "envault", "unique"])).rejects.toThrow("exit");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
    spy.mockRestore();
    exitSpy.mockRestore();
  });

  it("exits with error on decryption failure", async () => {
    jest.spyOn(crypto, "decrypt").mockRejectedValue(new Error("bad decrypt"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(makeProgram().parseAsync(["node", "envault", "unique"])).rejects.toThrow("exit");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Failed to decrypt"));
    spy.mockRestore();
    exitSpy.mockRestore();
  });
});
