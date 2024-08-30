import dedent from "dedent"
import { $ } from "execa"
import { describe, expect, it } from "vitest"

const RUNNER = "tsx"
const SCRIPT = "packages/cross-release-cli/src/app.ts"

describe.concurrent("show help message", () => {
    const helpMessage = dedent`
        Usage: cross-release [version] [options]

        A release tool that support multi programming language
    `

    it("ts file", async () => {
        const { stdout } = await $`${RUNNER} ${SCRIPT} -h`
        expect(stdout).toContain(helpMessage)
    })

    it("bin script", async () => {
        const { stdout } = await $`node packages/cross-release-cli/bin/cross-release.mjs -h`
        expect(stdout).toContain(helpMessage)
    })
})

describe("execute commands", () => {
    it("single command", async () => {
        const { command } = await $({ all: true })`${RUNNER} ${SCRIPT} --dry --cwd fixture --no-commit --no-push --no-tag 0.0.1 --execute 'echo hello'`
        expect(command).toBe("tsx packages/cross-release-cli/src/app.ts --dry --cwd fixture --no-commit --no-push --no-tag 0.0.1 --execute 'echo hello'")
    })
})
