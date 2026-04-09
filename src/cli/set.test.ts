import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as vaultModule from "../vault";
import * as vaultEntry from "../vault/vaultEntry";
import { runSet } from "./set";

vi.mock("../vault", () => ({
  vaultExists: vi.fn(),
  readVault: vi.fn(),
  writeVault: vi.fn(),
}));

vi.mock("../vault/vaultEntry", () => ({
  setEntry: vi.fn(),
}));

vi.mock("./set", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./set")>();
  return {
    ...mod,
    prompt: vi.fn(),
  };
});

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("runSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exits if vault does not exist", async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(false);
    await runSet(["MY_VAR", "my_value"]);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("sets a variable with provided key and value", async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    const fakeVault = { entries: [] };
    const updatedVault = { entries: [{ key: "MY_VAR", value: "my_value" }] };
    vi.mocked(vaultModule.readVault).mockResolvedValue(fakeVault as never);
    vi.mocked(vaultEntry.setEntry).mockReturnValue(updatedVault as never);
    vi.mocked(vaultModule.writeVault).mockResolvedValue(undefined);

    const { prompt } = await import("./set");
    vi.mocked(prompt).mockResolvedValue("testpassword");

    await runSet(["MY_VAR", "my_value"]);

    expect(vaultModule.readVault).toHaveBeenCalledWith("testpassword");
    expect(vaultEntry.setEntry).toHaveBeenCalledWith(fakeVault, "MY_VAR", "my_value");
    expect(vaultModule.writeVault).toHaveBeenCalledWith(updatedVault, "testpassword");
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Set MY_VAR"));
  });

  it("exits on invalid variable name", async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    await runSet(["123invalid", "value"]);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Invalid variable name"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
