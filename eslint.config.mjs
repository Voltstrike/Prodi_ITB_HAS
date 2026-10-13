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
    "prisma/contract.d.ts",
    "migrations/snapshots/**/contract.d.ts",
    ".agents/skills/prisma-8/**",
    ".claude/skills/prisma-8/**",
    ".cursor/skills/prisma-8/**",
    ".devin/skills/prisma-8/**",
  ]),
]);

export default eslintConfig;
