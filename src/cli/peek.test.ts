import { Command } from "commander";
import { registerPeekCommand } from "./peek";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerPeekCommand(program);
  return program;
}

const mockVault = {
  DATABASE_URL: { value: "postgres://user:secret@localhost:5432/db", tags: [] },
  SHORT: { value: "ab", tags: [] },
  API_KEY: { value: "12345678", tags: [] },
};

beforeEach(() => {
  jest.spyOn(vaultModule, "readVault").mockResolvedValue(mockVault as any);
  jest
    .spyOn(require("readline"), "createInterface")
    .mockReturnValue({ close: jest.fn() } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("peek command", () => {
  it("masks all but last 4 chars by default", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const program = makeProgram();
    // Simulate password prompt resolving immediately
    jest.spyOn(require("./peek"), "promptPassword" as any).mockResolvedValue("secret").mockRestore;

    // Directly invoke action by bypassing prompt via mock
    const peekCmd = program.commands.find((c) => c.name() === "peek")!;
    await (peekCmd as any)._actionHandler(["DATABASE_URL", { reveal: false, chars: "4" }]);

    expect(logs[0]).toMatch(/DATABASE_URL=/);
    const masked = logs[0].split("=")[1];
    expect(masked.endsWith("5/db")).toBe(true);
    expect(masked).toContain("*");
  });

  it("reveals full value with --reveal", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const peekCmd = makeProgram().commands.find((c) => c.name() === "peek")!;
    await (peekCmd as any)._actionHandler(["API_KEY", { reveal: true, chars: "4" }]);

    expect(logs[0]).toBe("API_KEY=12345678");
  });

  it("masks fully when value is shorter than or equal to visible chars", async () => {
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const peekCmd = makeProgram().commands.find((c) => c.name() === "peek")!;
    await (peekCmd as any)._actionHandler(["SHORT", { reveal: false, chars: "4" }]);

    expect(logs[0]).toBe("SHORT=**");
  });

  it("exits with error when key not found", async () => {
    const errLogs: string[] = [];
    jest.spyOn(console, "error").mockImplementation((msg) => errLogs.push(msg));
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    const peekCmd = makeProgram().commands.find((c) => c.name() === "peek")!;
    await expect(
      (peekCmd as any)._actionHandler(["MISSING_KEY", { reveal: false, chars: "4" }])
    ).rejects.toThrow("exit");

    expect(errLogs[0]).toMatch(/not found/);
    exitSpy.mockRestore();
  });
});
