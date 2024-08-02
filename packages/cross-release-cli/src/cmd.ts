import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import cac from "cac"
import { defu } from "defu"
import { version } from "../package.json"
import type { ReleaseOptions } from "./types"


const CONFIG_DEFAULT: ReleaseOptions = {
    commit: {
        shouldStageAll: true,
        shouldVerify: true,
        template: "chore: release v%s",
    },
    dir: process.cwd(),
    excludes: ["node_modules", ".git"],
    isAllYes: false,
    isDry: false,
    isRecursive: false,
    main: "javascript",
    push: {
        shouldFollowTags: false,
    },
    shouldCommit: false,
    shouldPush: false,
    shouldTag: false,
    showHelp: false,
    showVersion: false,
    version: "",
}

// TODO: should give more approches for config
export function loadUserConfig(overrides: Partial<ReleaseOptions>) {
    const file = fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
    const userConfig = JSON.parse(file)["cross-release"]
    return defu<ReleaseOptions, any>(overrides, userConfig, CONFIG_DEFAULT)
}

function _filterNull(obj: any) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
        if (value) {
            result[key] = value
        }
    }
    return result
}

export function parseOptions() {
    const cli = cac("cross-release")
        .version(version)
        .usage("[flags] version")
        .option("-r, --recursive", "Run the command for each project in the workspace (default: false)")
        .option("-c, --commit", "Commit current changes (default: false)")
        .option("-d, --dry", "Dry run (default: false)")
        .option("-e, --exclude [dir]", "Folders to exclude from search")
        .option("-m, --main", "Base project language (e.g. java, rust, javascript default: javascript)")
        .option("-D, --dir [dir]", "Set working directory (default: project root)")
        .option("-p, --push", "Push the project to remote (default: false)")
        .option("-t, --tag", "Create a tag for current version (default: false)")
        .option("-y, --yes", "Answer yes to all prompts (default: false)")
        .help()
        .parse()

    const { args, options } = cli
    const parsedArgs: ReleaseOptions = loadUserConfig({
        dir: options.dir,
        excludes: options.exclude,
        isAllYes: options.yes,
        isDry: options.dry,
        isRecursive: options.recursive,
        shouldCommit: options.commit,
        shouldPush: options.push,
        shouldTag: options.tag,
        showHelp: options.help,
        showVersion: options.version,
        version: args[0],
    })
    return parsedArgs
}
