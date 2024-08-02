import { defineConfig } from "vitest/config"

export default defineConfig({
    server: {
        watch: {
            ignored: ["**/fixture/**"],
        },
    },
    test: {
        name: "cross-release",
    },
})
