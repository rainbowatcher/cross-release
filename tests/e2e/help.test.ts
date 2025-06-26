import dedent from "dedent"
import { execaSync } from "execa"
import { describe, it } from "vitest"
import { version } from "../../package.json" with { type: "json" }

const RUNNER = "tsx"
const SCRIPT = "packages/cross-release-cli/src/run.ts"

function run(...args: string[]) {
    return execaSync({ all: true, reject: false })`${RUNNER} ${SCRIPT} ${args}`
}

describe("help", () => {

    it("should show help", ({ expect }) => {
        const { stdout } = run(`-Dh`)
        expect(stdout).toMatchInlineSnapshot(dedent`
            "cross-release/${version}

            Usage:
              $ cross-release [version] [options]

            Options:
              -v, --version                 Display version number 
              -a, --all                     shortcut for --commit.stageAll 
              -c, --config [file]           Config file (auto detect by default) 
              -D, --dry                     Dry run 
              -d, --debug                   Enable debug mode 
              -e, --exclude [dir...]        Folders to exclude from search 
              -m, --main [lang]             Base project language [e.g. java, rust, javascript] 
              -r, --recursive               Run the command for each project in the workspace 
              -x, --execute [command...]    Execute the command 
              -y, --yes                     Answer yes to all prompts 
              --cwd [dir]                   Set working directory 
              --commit                      Committing changes 
              --commit.signoff              Commit with signoff 
              --commit.stageAll             Stage all changes before commit 
              --commit.template <template>  Template for commit message 
              --commit.verify               Verify commit message 
              --push                        Pushing Commit to remote 
              --push.followTags             Pushing with follow tags 
              --push.branch <branch>        Branch name to push 
              --tag                         Tagging for release 
              --tag.template <template>     Template for tag message 
              -h, --help                    Display this message "
        `)
    })
})
