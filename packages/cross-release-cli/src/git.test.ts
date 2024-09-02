import process from "node:process"
import { describe, expect, it } from "vitest"
import { gitOriginUrl } from "./git"

describe.runIf(!process.env.CI)("getOriginUrl", () => {
    it("should return the origin url", () => {
        const mockStdout = "https://github.com/rainbowatcher/cross-release"
        const result = gitOriginUrl()
        expect(result).toContain(mockStdout)
    })
})
