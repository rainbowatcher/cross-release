import process from "node:process"
import { describe, expect, it } from "vitest"
import { getGitignores } from "./ignore"


describe("getGitignores", () => {
    it("should initialize the set with predefined ignore patterns", () => {
        const set = getGitignores("not-exists-dir")

        expect(set.size).toBe(5) // Number of predefined patterns
        expect(set.has("node_modules")).toBeTruthy()
        expect(set.has(".git")).toBeTruthy()
        expect(set.has("dist")).toBeTruthy()
        expect(set.has("target")).toBeTruthy()
        expect(set.has("build")).toBeTruthy()
        expect(set.has("pattern2")).toBeFalsy()
    })

    it("should update the set with patterns from existing .gitignore files", () => {
        const set = getGitignores(`${process.cwd()}/fixture`)
        expect(set.size).toBe(7)
        expect(set.has("ignored")).toBeTruthy()
        expect(set.has("**/ignored/**")).toBeTruthy()
        expect(set.has("pattern2")).toBeFalsy()
    })
})
