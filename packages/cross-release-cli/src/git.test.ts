import { describe, expect, it } from "vitest"
import { getOriginUrl } from "./git"

describe("getOriginUrl", () => {
  it("should return the origin url", () => {
    const mockStdout = "https://github.com/rainbowatcher/cross-release.git"
    const result = getOriginUrl()
    expect(result).toEqual(mockStdout)
  })
})