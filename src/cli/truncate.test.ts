import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerTruncateCommand } from "./truncate";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTruncateCommand(program);
  return program;
}

const mockVault = {
  entries: [
    { key: "API_KEY", value: "abc123", tags: [] },
    { key: "DB_URL", value: "postgres://", tags: [] },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("truncate command", () => {
  it("removes all entries when confirmed with --force", async () => {
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultModule, "readVault").mockResolvedValue(structuredClone(mockVault) as any);
    const writeSpy = vi.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined as any);

    const program = makeProgram();
    await program.parseAsync(["node", "test", "truncate", "--force", "--vault", "/tmp/.envault"], { from: "user" });

    expect(writeSpy).toHaveBeenCalledOnce();
    const written = writeSpy.mock.calls[0][2] as any;
    expect(written.entries).toHaveLength(0);
  });

  it("exits if vault does not exist", async () => {
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(false);
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "test", "truncate", "--force", "--vault", "/tmp/.envault"], { from: "user" })
    ).rejects.toThrow();
  });

  it("exits on bad password", async () => {
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultModule, "readVault").mockRejectedValue(new Error("bad decrypt"));

    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "test", "truncate", "--force", "--vault", "/tmp/.envault"], { from: "user" })
    ).rejects.toThrow();
  });

  it("aborts when user does not type yes", async () => {
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    const writeSpy = vi.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined as any);

    // Simulate prompt returning 'no'
    const readline = await import("readline");
    vi.spyOn(readline, "createInterface").mockReturnValue({
      question: (_q: string, cb: (a: string) => void) => cb("no"),
      close: vi.fn(),
    } as any);

    const program = makeProgram();
    await program.parseAsync(["node", "test", "truncate", "--vault", "/tmp/.envault"], { from: "user" });
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
