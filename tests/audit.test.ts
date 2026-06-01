import { readFileSync } from "node:fs";

describe("Repository audit evidence", () => {
  it(".gitignore excludes local environment files", () => {
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(gitignore).toContain(".env");
    expect(gitignore).toContain(".env.*");
    expect(gitignore).toContain("!.env.example");
  });

  it("documents and exposes the Prisma seed command", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
      prisma?: { seed?: string };
    };
    const readme = readFileSync("README.md", "utf8");

    expect(packageJson.scripts["prisma:seed"]).toBeDefined();
    expect(packageJson.prisma?.seed).toBe("tsx prisma/seed.ts");
    expect(readme).toContain("npm run prisma:seed");
    expect(readme).toContain("Demo Accounts");
  });
});
