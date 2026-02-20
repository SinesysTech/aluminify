import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tool-generated artifacts
    ".mastra/**",
    // Generated files that should not be linted
    "lib/database.types.ts",
    // SQL migrations/seeds are not linted by ESLint in this repo
    "**/*.sql",
  ]),
  {
    settings: {
      // Workaround: eslint-plugin-react auto-detection uses removed context.getFilename() in ESLint 10.
      // Pin React version explicitly until eslint-plugin-react releases ESLint 10 support.
      // Track: https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
      react: { version: "19" },
    },
    rules: {
      // Allow unused variables that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
    },
  },
  {
    files: ["tests/**/*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "prefer-const": "off",
    },
  },
]);

export default eslintConfig;
