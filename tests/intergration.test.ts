import process from "node:process"
import dedent from "dedent"
import { $ } from "execa"
import { describe, expect, it } from "vitest"
import { version } from "../package.json"

const RUNNER = "tsx"
const SCRIPT = "packages/cross-release-cli/src/cli.ts"

describe.concurrent("show help message", () => {
    const helpMessage = dedent`
        cross-release/${version}
    
        Usage:
          $ cross-release [version] [options]
    
        Options:
          -v, --version              Display version number 
          -c, --config [file]        Config file (auto detect by default) 
          -D, --dry                  Dry run (default: false)
          -d, --debug                Enable debug mode (default: false)
          -e, --exclude [dir]        Folders to exclude from search 
          -m, --main                 Base project language [e.g. java, rust, javascript] (default: javascript)
          -r, --recursive            Run the command for each project in the workspace (default: false)
          -x, --execute.* [command]  Execute the command (default: )
          -y, --yes                  Answer yes to all prompts (default: false)
          --cwd [dir]                Set working directory (default: ${process.cwd()})
          --no-commit                Skip committing changes (default: true)
          --no-push                  Skip pushing (default: true)
          --no-tag                   Skip tagging (default: true)
          -h, --help                 Display this message 
    `

    it("ts file", async () => {
        const { stdout } = await $`${RUNNER} ${SCRIPT} -h`
        // cac add a whitespace at the help and version option end,
        // dedent will trim the whitespace at the end of string,
        // so the expected output will have a whitespace at the end
        expect(stdout).toBe(`${helpMessage} `)
    })

    it("bin script", async () => {
        const { stdout } = await $`node packages/cross-release-cli/bin/cross-release.mjs -h`
        expect(stdout).toBe(`${helpMessage} `)
    })
})

describe("execute commands", () => {
    it("single command", async () => {
        const { command } = await $({ all: true })`${RUNNER} ${SCRIPT} --dry --cwd fixture --no-commit --no-push --no-tag 0.0.1 --execute 'echo hello'`
        expect(command).toBe(`"tsx packages/cross-release-cli/src/cli.ts --dry --cwd fixture --no-commit --no-push --no-tag 0.0.1 --execute 'echo hello'"`)
    })
})
