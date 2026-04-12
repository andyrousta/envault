import fs from "fs";
import path from "path";
import { Command } from "commander";
import {
  templateFilePath,
  listTemplates,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
  registerTemplateCommand,
} from "./template";
import * as vaultFile from "../vault/vaultFile";

const TEST_TEMPLATES_DIR = path.join(process.cwd(), ".envault", "templates");

function cleanup(name: string) {
  const fp = templateFilePath(name);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

describe("template utilities", () => {
  const name = "__test_template__";

  afterEach(() => cleanup(name));

  it("saves and loads a template", () => {
    saveTemplate(name, ["KEY_A", "KEY_B"]);
    const keys = loadTemplate(name);
    expect(keys).toEqual(["KEY_A", "KEY_B"]);
  });

  it("lists saved templates", () => {
    saveTemplate(name, ["KEY_A"]);
    const templates = listTemplates();
    expect(templates).toContain(name);
  });

  it("deletes a template", () => {
    saveTemplate(name, ["KEY_A"]);
    deleteTemplate(name);
    expect(fs.existsSync(templateFilePath(name))).toBe(false);
  });

  it("throws when loading non-existent template", () => {
    expect(() => loadTemplate("__nonexistent__")).toThrow();
  });

  it("throws when deleting non-existent template", () => {
    expect(() => deleteTemplate("__nonexistent__")).toThrow();
  });
});

describe("template commands", () => {
  function makeProgram() {
    const program = new Command();
    program.exitOverride();
    registerTemplateCommand(program);
    return program;
  }

  it("lists templates with no templates", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "template", "list"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No templates"));
    spy.mockRestore();
  });

  it("save command writes template from vault", async () => {
    const mockVault = [
      { key: "FOO", value: "bar", tags: [], createdAt: "2024-01-01" },
      { key: "BAZ", value: "qux", tags: [], createdAt: "2024-01-01" },
    ];
    jest.spyOn(vaultFile, "readVault").mockResolvedValue(mockVault as any);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "template", "save", "__cmd_test__", "-p", "pass"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("2 key(s)"));
    spy.mockRestore();
    cleanup("__cmd_test__");
    jest.restoreAllMocks();
  });
});
