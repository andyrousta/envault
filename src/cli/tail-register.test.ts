import { Command } from "commander";
import { registerTailCommandAlias } from "./tail-register";
import * as vaultFile from "../vault/vaultFile";
import * as crypto from "../crypto";

const mockVault = {
  FOO: { value: "enc_foo", tags: [] },
  BAR: { value: "enc_bar", tags: ["dev"] },
};

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTailCommandAlias(program);
  return program;
}

beforeEach(() => {
  jest.spyOn(vaultFile, "readVault").mockResolvedValue(mockVault as any);
  jest.spyOn(crypto, "decrypt").mockImplementation(async (v: string) => v.replace("enc_", ""));
});

afterEach(() => jest.restoreAllMocks());

describe("tail-register", () => {
  it("registers the tail command", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "tail", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("FOO");
    expect(output).toContain("BAR");
  });

  it("registers the last alias", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "last", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("FOO");
  });

  it("last alias respects -n flag", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "last", "-n", "1", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("BAR");
    expect(output).not.toContain("FOO");
  });

  it("last alias respects --tag flag", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "envault", "last", "--tag", "dev", "-p", "secret"]);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("BAR");
    expect(output).not.toContain("FOO");
  });
});
