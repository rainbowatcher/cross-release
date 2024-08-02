import { describe, expect, it } from "vitest"
import { isBlankPath } from "./util"

describe("isBlankPath", () => {
    it("should return true for undefined path", () => {
        const path = undefined
        const isBlank = isBlankPath(path)
        expect(isBlank).toBe(true)
    })

    it("should return true for empty string path", () => {
        const path = ""
        const isBlank = isBlankPath(path)
        expect(isBlank).toBe(true)
    })

    it("should return false for non-empty string path", () => {
        const path = "some/path"
        const isBlank = isBlankPath(path)
        expect(isBlank).toBe(false)
    })
})
