import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerShellCommand } from "./shell-register";
import * as shellModule from "./shell";
import yargs from "yargs";

vi.mock("./shell", () => ({
  shellCommand: vi.fn().mockResolvedValue(undefined),
}));

const mockShellCommand = vi.mocked(shellModule.shellCommand);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerShellCommand", () => {
  it("registers the shell command on the CLI", () => {
    const cli = yargs([]);
    const result = registerShellCommand(cli);
    const commands = (result as any).getInternalMethods().getCommandInstance().getCommands();
    expect(commands).toContain("shell");
  });

  it("calls shellCommand with resolved vault dir and default shell", async () => {
    const cli = yargs(["shell"]);
    registerShellCommand(cli);
    await cli.parse();
    expect(mockShellCommand).toHaveBeenCalledWith(
      expect.any(String),
      process.env.SHELL || "/bin/sh"
    );
  });

  it("calls shellCommand with custom shell when --shell flag is provided", async () => {
    const cli = yargs(["shell", "--shell", "/usr/bin/zsh"]);
    registerShellCommand(cli);
    await cli.parse();
    expect(mockShellCommand).toHaveBeenCalledWith(
      expect.any(String),
      "/usr/bin/zsh"
    );
  });
});
