import next from "eslint-config-next";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = [
  ...next,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "supabase/**",
      "coverage/**",
      ".stryker-tmp/**",
      "reports/**",
      // Nested git worktrees (.claude/worktrees/<name>/) are separate
      // checkouts with their own node_modules/.next/etc — the globs above
      // are root-anchored (gitignore semantics) and don't reach into them.
      "**/.claude/worktrees/**",
    ],
  },
  {
    plugins: { sonarjs },
    rules: {
      "no-inline-comments": [
        "error",
        {
          ignorePattern:
            "eslint-|@ts-|prettier-|c8 |istanbul |webpackChunkName",
        },
      ],
      "sonarjs/no-commented-code": "error",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/test/**", "scripts/**"],
    rules: { "no-inline-comments": "off" },
  },
];

export default eslintConfig;
