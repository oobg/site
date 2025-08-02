import js from "@eslint/js";
import globals from "globals";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginImport from "eslint-plugin-import";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config([
  js.configs.recommended,
  reactRefresh.configs.vite,
  prettier,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
      },
    },
    plugins: {
      react: eslintPluginReact,
      "import": eslintPluginImport,
      "react-hooks": eslintPluginReactHooks,
      "@typescript-eslint": tseslint.plugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json"], // or tsconfig.app.json
          alwaysTryTypes: true
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"]
        },
        alias: {
          map: [
            ["@src", "./src"],
            ["/", "./public"],
          ],
          extensions: [".ts", ".tsx", ".js", ".jsx"]
        }
      }
    },
    rules: {
      // ✅ 엄격한 타입 규칙
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/strict-boolean-expressions": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: true },
      ],

      // ✅ React 관련
      "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
      "react/function-component-definition": [
        "error",
        {
          namedComponents: ["arrow-function", "function-declaration"],
        },
      ],
      "react/no-unstable-nested-components": ["warn", { allowAsProps: true }],

      // ✅ React Refresh
      "react-refresh/only-export-components": "off",

      // ✅ import 관련
      "import/no-unresolved": "error",
      "import/extensions": "off",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/*.stories.tsx",
            "**/__tests__/**",
            "**/__mocks__/**",
          ],
        },
      ],

      // ✅ 일반 JS 규칙
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",

      // ✅ 코드 스타일: prettier와 충돌 제거
      quotes: "off",
      semi: "off",
      "comma-dangle": "off",
      "space-before-function-paren": "off",
    },
  },
]);
