import { defineConfig } from "tsup"

export default defineConfig({
    clean: true,
    dts: {
        entry: [
            "src/app.ts",
            "src/index.ts",
            "src/types.ts",
        ],
    },
    entry: ["src/index.ts", "src/app.ts"],
    format: ["esm"],
    skipNodeModulesBundle: true,
})
