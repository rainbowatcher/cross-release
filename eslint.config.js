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
    rules: {
        "unicorn/no-process-exit": "off",
    },
})
