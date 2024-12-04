import { describe, expect, it } from "vitest"
import { resolveAltOptions } from "./config"
import { CONFIG_DEFAULT } from "../constants"
import type { ReleaseOptions } from "../types"

const options: ReleaseOptions = {
    all: false,
    commit: true,
    config: "",
    cwd: "",
    debug: false,
    dry: false,
    exclude: [],
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
        expect(result).toStrictEqual({})
    })

    it("should return default if value is true", () => {
        const result = resolveAltOptions(options, "commit", CONFIG_DEFAULT.commit)
        expect(result).toStrictEqual(CONFIG_DEFAULT.commit)
    })

    it("should return {} if value is false", () => {
        const result = resolveAltOptions(options, "push", CONFIG_DEFAULT.push)
        expect(result).toStrictEqual({})
    })
})
