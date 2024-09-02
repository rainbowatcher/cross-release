import { defineConfig } from "tsup"

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts", "src/app.ts"],
    format: ["esm"],
})
