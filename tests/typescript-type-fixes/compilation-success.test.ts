/**
 * Property-Based Tests for Compilation Success
 * Feature: typescript-type-fixes
 * Property 9: Compilation Success
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import fc from "fast-check";
import { execSync } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Get all TypeScript files in a directory recursively
 */
function getTypeScriptFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (!["node_modules", ".next", ".git", "dist", "build"].includes(file)) {
        getTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Run TypeScript compiler with --noEmit flag
 */
function runTypeScriptCompiler(): { exitCode: number; output: string } {
  try {
    const output = execSync("npx tsc --noEmit", {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: process.cwd(),
    });
    return { exitCode: 0, output };
  } catch (error: any) {
    return {
      exitCode: error.status || 1,
      output: error.stdout || error.stderr || error.message,
    };
  }
}

describe("Property 9: Compilation Success", () => {
  /**
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
   *
   * Property: For all TypeScript files in the project, running `tsc --noEmit`
   * SHALL complete with zero type errors and exit code 0.
   */
  it("should compile all TypeScript files without errors", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Run the test multiple times to ensure consistency
        fc.constant(null),
        async () => {
          const result = runTypeScriptCompiler();

          // Verify exit code is 0 (success)
          expect(result.exitCode).toBe(0);

          // Verify no error output
          expect(result.output).not.toContain("error TS");

          // If there are errors, the output will contain "error TS" followed by error codes
          // This assertion ensures zero type errors
          const errorMatch = result.output.match(/error TS\d+:/g);
          expect(errorMatch).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout for compilation

  /**
   * **Validates: Requirement 8.2**
   *
   * Property: All files in app/shared/core/services/ should type-check successfully
   */
  it("should successfully type-check all files in app/shared/core/services/", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const servicesDir = join(
          process.cwd(),
          "app",
          "shared",
          "core",
          "services",
        );

        // Verify directory exists
        expect(existsSync(servicesDir)).toBe(true);

        // Get all TypeScript files in app/shared/core/services/
        const tsFiles = getTypeScriptFiles(servicesDir);

        // Verify we found TypeScript files
        expect(tsFiles.length).toBeGreaterThan(0);

        // Run type checker - should succeed
        const result = runTypeScriptCompiler();
        expect(result.exitCode).toBe(0);

        // Verify no errors in app/shared/core/services/ files
        for (const file of tsFiles) {
          const relativePath = file.replace(process.cwd(), "");
          expect(result.output).not.toContain(`${relativePath}(`);
        }
      }),
      { numRuns: 100 },
    );
  }, 60000);

  /**
   * **Validates: Requirement 8.3**
   *
   * Property: All files in app/api/ should type-check successfully
   */
  it("should successfully type-check all files in app/api/", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const apiDir = join(process.cwd(), "app", "api");

        // Verify directory exists
        expect(existsSync(apiDir)).toBe(true);

        // Get all TypeScript files in app/api/
        const tsFiles = getTypeScriptFiles(apiDir);

        // Verify we found TypeScript files
        expect(tsFiles.length).toBeGreaterThan(0);

        // Run type checker - should succeed
        const result = runTypeScriptCompiler();
        expect(result.exitCode).toBe(0);

        // Verify no errors in app/api/ files
        for (const file of tsFiles) {
          const relativePath = file.replace(process.cwd(), "");
          expect(result.output).not.toContain(`${relativePath}(`);
        }
      }),
      { numRuns: 100 },
    );
  }, 60000);

  /**
   * **Validates: Requirement 8.4**
   *
   * Property: All files in components/ should type-check successfully
   */
  it("should successfully type-check all files in components/", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const componentsDir = join(process.cwd(), "components");

        // Verify directory exists
        expect(existsSync(componentsDir)).toBe(true);

        // Get all TypeScript files in components/
        const tsFiles = getTypeScriptFiles(componentsDir);

        // Verify we found TypeScript files
        expect(tsFiles.length).toBeGreaterThan(0);

        // Run type checker - should succeed
        const result = runTypeScriptCompiler();
        expect(result.exitCode).toBe(0);

        // Verify no errors in components/ files
        for (const file of tsFiles) {
          const relativePath = file.replace(process.cwd(), "");
          expect(result.output).not.toContain(`${relativePath}(`);
        }
      }),
      { numRuns: 100 },
    );
  }, 60000);

  /**
   * **Validates: Requirement 8.5**
   *
   * Property: lib/auth.ts and related utility files should type-check successfully
   */
  it("should successfully type-check lib/auth.ts and related utility files", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const libDir = join(process.cwd(), "lib");

        // Verify directory exists
        expect(existsSync(libDir)).toBe(true);

        // Check for specific files
        const authFile = join(libDir, "auth.ts");
        const hasAuthFile = existsSync(authFile);

        // Get all TypeScript files in lib/
        const tsFiles = getTypeScriptFiles(libDir);

        // Verify we found TypeScript files
        expect(tsFiles.length).toBeGreaterThan(0);

        // Run type checker - should succeed
        const result = runTypeScriptCompiler();
        expect(result.exitCode).toBe(0);

        // Verify no errors in lib/ files
        for (const file of tsFiles) {
          const relativePath = file.replace(process.cwd(), "");
          expect(result.output).not.toContain(`${relativePath}(`);
        }

        // If auth.ts exists, specifically verify it has no errors
        if (hasAuthFile) {
          expect(result.output).not.toContain("lib/auth.ts(");
        }
      }),
      { numRuns: 100 },
    );
  }, 60000);

  /**
   * **Validates: Requirement 8.6**
   *
   * Property: The build process should complete without type errors
   */
  it("should complete build process without type errors", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Running tsc --noEmit is equivalent to the type-checking phase of the build
        const result = runTypeScriptCompiler();

        // Verify successful compilation (exit code 0)
        expect(result.exitCode).toBe(0);

        // Verify no type errors in output
        expect(result.output).not.toContain("error TS");

        // Count errors (should be 0)
        const errorCount = (result.output.match(/error TS\d+:/g) || []).length;
        expect(errorCount).toBe(0);
      }),
      { numRuns: 100 },
    );
  }, 60000);

  /**
   * **Validates: Requirement 8.1**
   *
   * Property: TypeScript compilation should report zero type errors
   */
  it("should report exactly zero type errors when running tsc", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const result = runTypeScriptCompiler();

        // Parse error count from output
        // TypeScript outputs "Found X errors" at the end if there are errors
        const errorCountMatch = result.output.match(/Found (\d+) errors?/);

        if (errorCountMatch) {
          const errorCount = parseInt(errorCountMatch[1], 10);
          expect(errorCount).toBe(0);
        }

        // Also verify exit code is 0
        expect(result.exitCode).toBe(0);
      }),
      { numRuns: 100 },
    );
  }, 60000);
});
