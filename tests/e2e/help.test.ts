import dedent from "dedent"
import { $ } from "execa"
import { describe, expect, it } from "vitest"

const RUNNER = "node"
const SCRIPT = "packages/cross-release-cli/bin/cross-release.js"

describe.concurrent("help", () => {
    const helpMessage = dedent`
        Usage: cross-release [version] [options]

        A release tool that support multi programming language
    `

    it("bin script", async () => {
        const { stdout } = await $`${RUNNER} ${SCRIPT} -h`
        expect(stdout).toContain(helpMessage)
    })
})
