import process from "node:process"
import { describe, expect, it } from "vitest"
import { getGitignores } from "./ignore"


describe("getGitignores", () => {
    it("should initialize the set with predefined ignore patterns", () => {
        const set = getGitignores("not-exists-dir")
        expect(set.size).toBe(0)
    })

    it("should update the set with patterns from existing .gitignore files", () => {
        const set = getGitignores(`${process.cwd()}/fixture`)
        expect(set.size).toBe(2)
        expect(set.has("ignored")).toBeTruthy()
        expect(set.has("**/ignored/**")).toBeTruthy()
        expect(set.has("pattern2")).toBeFalsy()
    })
})
