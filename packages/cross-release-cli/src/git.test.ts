import { describe, expect, it } from "vitest"
import { gitOriginUrl } from "./git"

describe("getOriginUrl", () => {
    it("should return the origin url", async () => {
        const mockStdout = "https://github.com/rainbowatcher/cross-release"
        const result = await gitOriginUrl()
        expect(result).toContain(mockStdout)
    })
})
