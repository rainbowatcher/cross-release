import { execaCommandSync, execaNode, execaSync } from "execa"
import {
    afterAll, describe, expect, it,
} from "vitest"
import type { Options, ResultPromise } from "execa"

let proc: ResultPromise<Options>
const script = "packages/cross-release-cli/bin/cross-release.mjs"

function runApp2(args: string[]) {
    return execaSync({ all: true, node: true })(script, args)
}

describe("exec", () => {
    afterAll(() => {
        proc?.kill()
    })

    it("should run", () => {
        const { all } = runApp2(["--cwd", "fixture"])
        expect(all).toContain("Pick a project version")
    })

    it("should run with dry", () => {
        const { all } = runApp2(["--cwd", "fixture", "--dry"])
        expect(all).toContain("DRY")
    })

    it("should run with version", () => {
        const { all, command } = runApp2(["--cwd", "fixture", "0.1.0", "--dry"])
        expect(command).toMatchInlineSnapshot(`"packages/cross-release-cli/bin/cross-release.mjs --cwd fixture 0.1.0 --dry"`)
        expect(all).toMatchInlineSnapshot(`
            "┌  Cross release
            │
            │   DRY RUN 
            [?25l│
            ◆  should commit?
            │  ● Yes / ○ No
            └"
        `)
    })
})
