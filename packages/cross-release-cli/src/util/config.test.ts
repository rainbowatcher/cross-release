import { describe, expect, it } from "vitest"
import { CONFIG_DEFAULT } from "../constants"
import { resolveAltOptions } from "./config"
import type { ReleaseOptions } from "../types"

const options: ReleaseOptions = {
    commit: true,
    config: "",
    cwd: "",
    debug: false,
    dry: false,
    excludes: [],
    execute: [],
    main: "javascript",
    push: false,
    recursive: false,
    tag: true,
    version: "",
    yes: false,
}

describe("resolveAltOptions", () => {
    it("should return the default value if value is undefined", () => {
        // @ts-expect-error param type incompatible
        const result = resolveAltOptions(options, "key")
        expect(result).toEqual({})
    })

    it("should return default if value is true", () => {
        const result = resolveAltOptions(options, "commit", CONFIG_DEFAULT.commit)
        expect(result).toEqual(CONFIG_DEFAULT.commit)
    })

    it("should return {} if value is false", () => {
        const result = resolveAltOptions(options, "push", CONFIG_DEFAULT.push)
        expect(result).toEqual({})
    })
})
