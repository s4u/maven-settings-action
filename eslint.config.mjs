import globals from "globals";
import js from "@eslint/js";

export default [js.configs.recommended, {
    languageOptions: {
        globals: {
            ...globals.node,
            Atomics: "readonly",
            SharedArrayBuffer: "readonly",
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {},
}];