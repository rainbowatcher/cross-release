import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "cross-release",
    dir: "packages",
    watchExclude: ["fixture/**/*.json"],
  },
})