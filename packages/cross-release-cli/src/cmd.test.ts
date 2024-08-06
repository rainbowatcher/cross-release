import process from "node:process"
import { getGitignores } from "cross-bump"
import { describe, expect, it } from "vitest"
import { loadUserConfig, resolveOptions } from "./cmd"
import { CONFIG_DEFAULT } from "./constants"
import type { CAC } from "cac"


describe.concurrent("arg parse", () => {
    it("should parse args", async () => {
        const cli = { args: [], options: {} }
        const opts = await resolveOptions(cli as unknown as CAC)
        const userConfig = await loadUserConfig({})
        expect(opts).toEqual({
            ...CONFIG_DEFAULT,
            cwd: process.cwd(),
            excludes: [...await getGitignores(process.cwd()), ...userConfig.excludes],
            version: undefined,
        })
    })
})
