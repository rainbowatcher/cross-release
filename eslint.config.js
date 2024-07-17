import { defineConfig } from "@rainbowatcher/eslint-config"

export default defineConfig({
    gitignore: true,
    json: true,
    markdown: true,
    style: true,
    toml: true,
    typescript: true,
    yaml: true,
}, {
    files: ["**/*.ts"],
    rules: {
        "perfectionist/sort-classes": "off",
    },
})
