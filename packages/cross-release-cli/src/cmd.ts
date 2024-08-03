import process from "node:process"
import cac from "cac"
import { defu } from "defu"
import { loadConfig } from "unconfig"
import { version } from "../package.json"
import createDebug from "./util/debug"
import type { ReleaseOptions, ReleaseOptionsDefault } from "./types"

const debug = createDebug("cmd")

export const CONFIG_DEFAULT: ReleaseOptionsDefault = {
    commit: {
        stageAll: true,
        template: "chore: release v%s",
        verify: true,
    },
    dir: process.cwd(),
    dry: false,
    excludes: ["node_modules", ".git"],
    main: "javascript",
    push: {
        followTags: false,
    },
    recursive: false,
    showVersion: false,
    tag: true,
    version: "",
    yes: false,
}

// TODO: should give more approches for config
export async function loadUserConfig(overrides: Partial<ReleaseOptions>): Promise<ReleaseOptions> {
    const { config: userConfig } = await loadConfig<Partial<ReleaseOptions>>({
        sources: [
            { files: "cross-release.config" },
            {
                extensions: ["json"],
                files: "package",
                rewrite(config: any) {
                    // eslint-disable-next-line ts/no-unsafe-return
                    return config["cross-release"]
                },
            },
        ],
    })

    return defu<ReleaseOptions, any>(overrides, userConfig, CONFIG_DEFAULT)
}


export async function parseOptions(): Promise<ReleaseOptions> {
    const cli = cac("cross-release")
    cli.version(version)
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
    const parsedArgs: ReleaseOptions = await loadUserConfig({
        ...options,
        showVersion: options.version,
        version: args[0],
    })
    debug("parsedArgs:", parsedArgs)
    if (cli.options.help) {
        // cli.outputHelp()
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0)
    }
    return parsedArgs
}
