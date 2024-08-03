import dedent from "dedent"
import { $ } from "execa"
import { describe, expect, it } from "vitest"
import { version } from "../package.json"

const helpMessage = dedent`
    cross-release/${version}

    Usage:
      $ cross-release [flags] version

    Options:
      -v, --version        Display version number 
      -r, --recursive      Run the command for each project in the workspace (default: false) 
      -c, --commit         Commit current changes (default: false) 
      -d, --dry            Dry run (default: false) 
      -e, --exclude [dir]  Folders to exclude from search 
      -m, --main           Base project language (e.g. java, rust, javascript default: javascript) 
      -D, --dir [dir]      Set working directory (default: project root) 
      -p, --push           Push the project to remote (default: false) 
      -t, --tag            Create a tag for current version (default: false) 
      -y, --yes            Answer yes to all prompts (default: false) 
      -h, --help           Display this message
`

describe("show help message", () => {
    it("ts file", async () => {
        const { stdout } = await $`tsx packages/cross-release-cli/src/cli.ts -h`
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
