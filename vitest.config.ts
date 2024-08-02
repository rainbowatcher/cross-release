import { defineConfig } from "vitest/config"

export default defineConfig({
    server: {
        watch: {
            ignored: ["**/fixture/**"],
        },
    },
    test: {
        coverage: {
            exclude: ["packages/{cross-release-cli,cross-bump}/src/index.ts", "**/types.ts"],
            include: ["packages/**/src/**/*.{ts,tsx}"],
        },
        name: "cross-release",
    },
})
