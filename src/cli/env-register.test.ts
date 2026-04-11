import { describe, it, expect, vi, beforeEach } from "vitest";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { registerEnvCommand } from "./env-register";
import * as envModule from "./env";
import * as vaultModule from "../vault";

vi.mock("./env");
vi.mock("../vault", () => ({
  vaultPath: vi.fn().mockReturnValue("/mock/vault.enc"),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(envModule, "envCommand").mockResolvedValue(undefined);
});

async function runCli(args: string[]) {
  const instance = registerEnvCommand(
    yargs(hideBin(["node", "envault", ...args]))
  );
  await instance.parseAsync();
}

describe("registerEnvCommand", () => {
  it("calls envCommand with empty args when no cmd given", async () => {
    await runCli(["env"]);
    expect(envModule.envCommand).toHaveBeenCalledWith(
      "/mock/vault.enc",
      [],
      { shell: false }
    );
  });

  it("passes cmd arguments to envCommand", async () => {
    await runCli(["env", "node", "server.js"]);
    expect(envModule.envCommand).toHaveBeenCalledWith(
      "/mock/vault.enc",
      ["node", "server.js"],
      { shell: false }
    );
  });

  it("passes --shell flag to envCommand", async () => {
    await runCli(["env", "--shell", "npm", "start"]);
    expect(envModule.envCommand).toHaveBeenCalledWith(
      "/mock/vault.enc",
      ["npm", "start"],
      { shell: true }
    );
  });

  it("uses vaultPath() for the vault location", async () => {
    await runCli(["env"]);
    expect(vaultModule.vaultPath).toHaveBeenCalled();
  });
});
