

import { describe, expect, it } from "vitest"
import { isBlankPath, isJsonMap } from "./util"

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

describe("isJsonMap", () => {
  it("should return true for valid JSON map", () => {
    const validJsonMap = { key: "value" }

    expect(isJsonMap(validJsonMap)).toBe(true)
  })

  it("should return false for null", () => {
    const nullValue = null

    expect(isJsonMap(nullValue)).toBe(false)
  })

  it("should return false for array", () => {
    const arrayValue = [1, 2, 3]

    expect(isJsonMap(arrayValue)).toBe(false)
  })

  it("should return false for Date object", () => {
    const dateValue = new Date()

    expect(isJsonMap(dateValue)).toBe(false)
  })
})