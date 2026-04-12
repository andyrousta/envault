import { Command } from "commander";
import { registerTailCommand } from "./tail";
import * as vaultFile from "../vault/vaultFile";
import * as crypto from "../crypto";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTailCommand(program);
  return program;
}

const mockVault = {
  ALPHA: { value: "enc_alpha", tags: ["production"] },
  BETA:  { value: "enc_beta",  tags: [] },
  GAMMA: { value: "enc_gamma", tags: ["production"] },
  DELTA: { value: "enc_delta", tags: ["staging"] },
};

beforeEach(() => {
  jest.spyOn(vaultFile, "readVault").mockResolvedValue(mockVault as any);
  jest.spyOn(crypto, "decrypt").mockImplementation(async (val: string) => val.replace("enc_", ""));
});

afterEach(() => jest.restoreAllMocks());

describe("tail command", () => {
  it("shows last 10 entries by default", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "tail", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("ALPHA");
    expect(output).toContain("DELTA");
  });

  it("limits output with -n", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "tail", "-n", "2", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("GAMMA");
    expect(output).toContain("DELTA");
    expect(output).not.toContain("ALPHA");
  });

  it("filters by tag", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "tail", "--tag", "production", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("ALPHA");
    expect(output).toContain("GAMMA");
    expect(output).not.toContain("DELTA");
  });

  it("shows message when no entries found", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "tail", "--tag", "nonexistent", "-p", "secret"]);
    expect(log).toHaveBeenCalledWith("No entries found.");
  });

  it("exits on error", async () => {
    jest.spyOn(vaultFile, "readVault").mockRejectedValue(new Error("bad password"));
    const exit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      makeProgram().parseAsync(["node", "envault", "tail", "-p", "wrong"])
    ).rejects.toThrow();
    expect(err).toHaveBeenCalledWith("Error:", "bad password");
  });
});
