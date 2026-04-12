import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerTruncateAlias } from "./truncate-register";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTruncateAlias(program);
  return program;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("truncate-register (clear alias)", () => {
  it("registers both truncate and clear commands", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("truncate");
    expect(names).toContain("clear");
  });

  it("clear command delegates to truncate and clears entries", async () => {
    const mockVault = { entries: [{ key: "X", value: "1", tags: [] }] };
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultModule, "readVault").mockResolvedValue(structuredClone(mockVault) as any);
    const writeSpy = vi.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined as any);

    const program = makeProgram();
    await program.parseAsync(
      ["node", "test", "clear", "--force", "--vault", "/tmp/.envault"],
      { from: "user" }
    );

    expect(writeSpy).toHaveBeenCalledOnce();
    const written = writeSpy.mock.calls[0][2] as any;
    expect(written.entries).toHaveLength(0);
  });

  it("clear command exits when vault does not exist", async () => {
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(false);
    const program = makeProgram();
    await expect(
      program.parseAsync(
        ["node", "test", "clear", "--force", "--vault", "/tmp/.envault"],
        { from: "user" }
      )
    ).rejects.toThrow();
  });
});
