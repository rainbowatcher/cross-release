import process from "node:process"
import { describe, expect, it } from "vitest"
import { getGitignores } from "./ignore"


describe("getGitignores", () => {
    it("should initialize the set with predefined ignore patterns", async () => {
        const set = await getGitignores("test-dir")

        expect(set.size).toBe(6) // Number of predefined patterns
        expect(set.has("**/node_modules/**")).toBe(true)
        expect(set.has("**/.git/**")).toBe(true)
        expect(set.has("**/dist/**")).toBe(true)
        expect(set.has("**/fixture(s)?/**")).toBe(true)
        expect(set.has("**/target/**")).toBe(true)
        expect(set.has("**/build/**")).toBe(true)
    })

    it("should update the set with patterns from existing .gitignore files", async () => {
        const set = await getGitignores(`${process.cwd()}/fixture`)
        expect(set.size).toBe(8)
        expect(set.has("ignored")).toBe(true)
        expect(set.has("**/ignored/**")).toBe(true)
        expect(set.has("pattern2")).toBe(false)
    })
})
