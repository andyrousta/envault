import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const profilePath = path.join(os.homedir(), ".envault", "profile.json");

export interface Profile {
  name: string;
  email?: string;
  createdAt: string;
}

export function readProfile(): Profile | null {
  if (!fs.existsSync(profilePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(profilePath, "utf-8")) as Profile;
  } catch {
    return null;
  }
}

export function writeProfile(profile: Profile): void {
  const dir = path.dirname(profilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), "utf-8");
}

export function registerWhoamiCommand(program: Command): void {
  const whoami = program.command("whoami").description("Show or set the current envault user profile");

  whoami
    .command("show")
    .description("Display the current profile")
    .action(() => {
      const profile = readProfile();
      if (!profile) {
        console.log("No profile set. Run: envault whoami set --name <name>");
        return;
      }
      console.log(`Name:    ${profile.name}`);
      if (profile.email) console.log(`Email:   ${profile.email}`);
      console.log(`Created: ${profile.createdAt}`);
    });

  whoami
    .command("set")
    .description("Set the current profile")
    .requiredOption("--name <name>", "Your display name")
    .option("--email <email>", "Your email address")
    .action((opts) => {
      const profile: Profile = {
        name: opts.name,
        email: opts.email,
        createdAt: new Date().toISOString(),
      };
      writeProfile(profile);
      console.log(`Profile saved for: ${profile.name}`);
    });

  whoami
    .command("clear")
    .description("Remove the current profile")
    .action(() => {
      if (fs.existsSync(profilePath)) {
        fs.unlinkSync(profilePath);
        console.log("Profile cleared.");
      } else {
        console.log("No profile to clear.");
      }
    });
}
