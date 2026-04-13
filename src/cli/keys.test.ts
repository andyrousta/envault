import { Command } from "commander";
import { registerKeysCommand } from "./keys";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerKeysCommand(program);
  return program;
}

describe("keys command", () => {
  const mockVault = {
    API_KEY: "abc123",
    DB_PASSWORD: "secret",
    APP_SECRET: "xyz789",
  };

  beforeEach(() => {
    jest.spyOn(vaultModule, "readVault").mockResolvedValue(mockVault as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists all keys sorted", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await makeProgram().parseAsync(["node", "test", "keys", "-p", "pass"]);

    expect(logs).toEqual(["API_KEY", "APP_SECRET", "DB_PASSWORD"]);
  });

  it("outputs JSON array when --json flag is set", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await makeProgram().parseAsync(["node", "test", "keys", "-p", "pass", "--json"]);

    const parsed = JSON.parse(logs[0]);
    expect(parsed).toEqual(["API_KEY", "APP_SECRET", "DB_PASSWORD"]);
  });

  it("shows only count when --count flag is set", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await makeProgram().parseAsync(["node", "test", "keys", "-p", "pass", "--count"]);

    expect(logs).toEqual([3]);
  });

  it("filters keys by prefix", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await makeProgram().parseAsync(["node", "test", "keys", "-p", "pass", "--prefix", "APP"]);

    expect(logs).toEqual(["APP_SECRET"]);
  });

  it("shows message when no keys found", async () => {
    jest.spyOn(vaultModule, "readVault").mockResolvedValue({} as any);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await makeProgram().parseAsync(["node", "test", "keys", "-p", "pass"]);

    expect(logs).toEqual(["No keys found."]);
  });

  it("exits with error on vault read failure", async () => {
    jest.spyOn(vaultModule, "readVault").mockRejectedValue(new Error("bad password"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(
      makeProgram().parseAsync(["node", "test", "keys", "-p", "wrong"])
    ).rejects.toThrow("exit");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
