import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: ["node_modules", "dist"],
  },
  {
    files: ["src/**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error", // Prettierのルールを適用
      "@typescript-eslint/no-unused-vars": "warn", // 未使用の変数を警告
      "@typescript-eslint/no-explicit-any": "warn", // 暗黙のanyを警告
    },
  },
];
