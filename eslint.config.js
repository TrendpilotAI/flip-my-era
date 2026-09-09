import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".claude-flow/**",
      ".codex/**",
      ".swarm/**",
      "build/**",
      "coverage/**",
      "dist/**",
      "dist-ssr/**",
      "e2e-screenshots/**",
      "out/**",
      "playwright-report/**",
      "reports/**",
      "screenshots/**",
      "supabase/.temp/**",
      "supabase/functions/**",
      "test-results/**",
      "test-results.log",
      "test-results.xml",
      "*.db",
      "*.sqlite",
      "*.sqlite3",
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
      "@typescript-eslint/no-unused-expressions": "off",
    },
  }
);
