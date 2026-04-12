import { Command } from "commander";
import { registerGrepCommand } from "./grep";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerGrepCommand(program);
  return program;
}

const mockVault = {
  entries: {
    DATABASE_URL: { value: "postgres://localhost:5432/mydb" },
    API_KEY: { value: "sk_live_abc123" },
    DEBUG: { value: "true" },
    REDIS_URL: { value: "redis://localhost:6379" },
  },
};

beforeEach(() => {
  jest.spyOn(vaultModule, "readVault").mockResolvedValue(mockVault as any);
  jest
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);
  jest
    .spyOn(require("readline"), "createInterface")
    .mockReturnValue({
      question: (_: string, cb: (a: string) => void) => cb("secret"),
      close: jest.fn(),
    });
});

afterEach(() => jest.restoreAllMocks());

test("prints matching key=value pairs", async () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  await makeProgram().parseAsync(["node", "envault", "grep", "localhost"]);
  expect(spy).toHaveBeenCalledWith("DATABASE_URL=postgres://localhost:5432/mydb");
  expect(spy).toHaveBeenCalledWith("REDIS_URL=redis://localhost:6379");
  expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("API_KEY"));
});

test("--keys-only prints only keys", async () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  await makeProgram().parseAsync(["node", "envault", "grep", "-k", "localhost"]);
  expect(spy).toHaveBeenCalledWith("DATABASE_URL");
  expect(spy).toHaveBeenCalledWith("REDIS_URL");
  expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("="));
});

test("--ignore-case matches case-insensitively", async () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  await makeProgram().parseAsync(["node", "envault", "grep", "-i", "TRUE"]);
  expect(spy).toHaveBeenCalledWith("DEBUG=true");
});

test("--invert shows non-matching entries", async () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  await makeProgram().parseAsync(["node", "envault", "grep", "-v", "localhost"]);
  expect(spy).toHaveBeenCalledWith("API_KEY=sk_live_abc123");
  expect(spy).toHaveBeenCalledWith("DEBUG=true");
  expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("DATABASE_URL"));
});

test("prints message when no entries match", async () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  await makeProgram().parseAsync(["node", "envault", "grep", "NOMATCH_XYZ"]);
  expect(spy).toHaveBeenCalledWith("No matching entries found.");
});
