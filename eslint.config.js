import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "old_controller.tsx",
      // MPEG transport-stream fixtures use .ts as their media extension.
      "tests/fixtures/channel-hls/*.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Test doubles and provider SDK adapters intentionally cross dynamic JSON
    // boundaries. Their runtime contracts are covered by the integration and
    // database suites; forcing unsafe casts here would reduce clarity.
    files: ["tests/**/*.{ts,tsx}", "supabase/functions/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // These ranges deliberately reject control characters from user input.
    files: ["src/lib/profile-website.ts", "supabase/functions/game-catalog/*.ts"],
    rules: {
      "no-control-regex": "off",
    },
  },
);
