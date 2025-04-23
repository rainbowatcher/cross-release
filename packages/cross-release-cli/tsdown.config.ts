import { defineConfig } from "tsdown"

export default defineConfig({
    clean: true,
    dts: {
        isolatedDeclarations: true,
    },
    entry: ["src/index.ts", "src/app.ts"],
    skipNodeModulesBundle: true,
})
