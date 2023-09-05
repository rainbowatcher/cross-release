import { describe, expect, it } from "vitest"
import { gitOriginUrl } from "./git"

describe("getOriginUrl", () => {
  it("should return the origin url", () => {
    const mockStdout = "https://github.com/rainbowatcher/cross-release.git"
    const result = gitOriginUrl()
    expect(result).toEqual(mockStdout)
  })
})