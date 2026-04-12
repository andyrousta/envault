import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerSortAlias } from "./sort-register";
import * as vaultFile from "../vault";

vi.mock("../vault");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSortAlias(program);
  return program;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
  vi.mocked(vaultFile.readVault).mockResolvedValue({ B: "2", A: "1" });
  vi.mocked(vaultFile.writeVault).mockResolvedValue(undefined);
});

describe("sort-register", () => {
  it("registers both sort and order commands", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("sort");
    expect(names).toContain("order");
  });

  it("order command sorts entries ascending", async () => {
    const program = makeProgram();
    vi.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "envault", "order"], { from: "user" });
    const [written] = vi.mocked(vaultFile.writeVault).mock.calls[0];
    expect(Object.keys(written)).toEqual(["A", "B"]);
  });

  it("order command passes --desc flag through", async () => {
    const program = makeProgram();
    vi.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "envault", "order", "--desc"], { from: "user" });
    const [written] = vi.mocked(vaultFile.writeVault).mock.calls[0];
    expect(Object.keys(written)).toEqual(["B", "A"]);
  });
});
