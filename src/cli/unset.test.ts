import { Command } from "commander";
import { registerUnsetCommand } from "./unset";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";
import * as unsetModule from "./unset";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerUnsetCommand(program);
  return program;
}

describe("unset command", () => {
  const mockEntries = [
    { key: "API_KEY", value: "abc123", tags: [], note: "", createdAt: "", updatedAt: "" },
    { key: "DB_URL", value: "postgres://localhost", tags: [], note: "", createdAt: "", updatedAt: "" },
  ];

  beforeEach(() => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    jest.spyOn(vaultEntry, "readVault" as any).mockResolvedValue(mockEntries);
    jest.spyOn(vaultEntry, "writeVault" as any).mockResolvedValue(undefined);
    jest.spyOn(unsetModule, "prompt").mockResolvedValue("password");
  });

  afterEach(() => jest.restoreAllMocks());

  it("removes an existing key after confirmation", async () => {
    jest
      .spyOn(unsetModule, "prompt")
      .mockResolvedValueOnce("password")
      .mockResolvedValueOnce("y");

    const writeSpy = jest.spyOn(vaultEntry, "writeVault" as any).mockResolvedValue(undefined);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await makeProgram().parseAsync(["node", "envault", "unset", "API_KEY"]);

    expect(writeSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ key: "DB_URL" })]),
      "password",
      undefined
    );
    expect(writeSpy.mock.calls[0][0].some((e: any) => e.key === "API_KEY")).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Removed"));
  });

  it("aborts if user does not confirm", async () => {
    jest
      .spyOn(unsetModule, "prompt")
      .mockResolvedValueOnce("password")
      .mockResolvedValueOnce("n");

    const writeSpy = jest.spyOn(vaultEntry, "writeVault" as any).mockResolvedValue(undefined);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await makeProgram().parseAsync(["node", "envault", "unset", "API_KEY"]);

    expect(writeSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Aborted.");
  });

  it("errors if vault does not exist", async () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    jest.spyOn(console, "error").mockImplementation();

    await expect(
      makeProgram().parseAsync(["node", "envault", "unset", "API_KEY"])
    ).rejects.toThrow("exit");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("errors if key does not exist in vault", async () => {
    jest.spyOn(unsetModule, "prompt").mockResolvedValueOnce("password");
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    jest.spyOn(console, "error").mockImplementation();

    await expect(
      makeProgram().parseAsync(["node", "envault", "unset", "MISSING_KEY"])
    ).rejects.toThrow("exit");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
