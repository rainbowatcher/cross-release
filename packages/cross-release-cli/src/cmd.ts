import process from "node:process"
import cac from "cac"
import { getGitignores } from "cross-bump"
import { defu } from "defu"
import { loadConfig } from "unconfig"
import { version } from "../package.json"
import { CONFIG_DEFAULT } from "./constants"
import createDebug, { isDebugEnable } from "./util/debug"
import type { CAC } from "cac"
import type { ReleaseOptions } from "./types"

const debug = createDebug("cmd")

// TODO: should give more approches for config
export async function loadUserConfig(overrides: Partial<ReleaseOptions>): Promise<ReleaseOptions> {
    const { config: userConfig, sources } = await loadConfig<Partial<ReleaseOptions>>({
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

    debug("load user config", sources)
    debug("user config:", userConfig)
    return defu<ReleaseOptions, any>(userConfig, overrides)
}

export function initCli(argv = process.argv) {
    const cli = cac("cross-release")
    cli.version(version)
        .usage("[version] [options]")
        .option("-D, --dry", `Dry run (default: ${CONFIG_DEFAULT.dry})`)
        .option("-d, --debug", `Enable debug mode (default: ${CONFIG_DEFAULT.debug})`)
        .option("-e, --exclude [dir]", "Folders to exclude from search")
        .option("-m, --main", `Base project language (e.g. java, rust, javascript default: ${CONFIG_DEFAULT.main})`)
        .option("-r, --recursive", `Run the command for each project in the workspace (default: ${CONFIG_DEFAULT.recursive})`)
        .option("-x, --execute.* [command]", `Execute the command (default: ${JSON.stringify(CONFIG_DEFAULT.execute)})`)
        .option("-y, --yes", `Answer yes to all prompts (default: ${CONFIG_DEFAULT.yes})`)
        .option("--cwd [dir]", "Set working directory (default: project root)")
        .option("--no-commit", "Skip committing changes")
        .option("--no-push", "Skip pushing")
        .option("--no-tag", "Skip tagging")
        .help()
        .parse(argv)
    return cli
}

export async function resolveOptions(cli: CAC): Promise<ReleaseOptions> {
    const { args, options } = cli
    const parsedArgs: ReleaseOptions = await loadUserConfig({
        ...options,
        commit: options.commit ?? CONFIG_DEFAULT.commit,
        cwd: options.cwd ?? CONFIG_DEFAULT.cwd,
        debug: options.debug ?? CONFIG_DEFAULT.debug,
        dry: options.dry ?? CONFIG_DEFAULT.dry,
        execute: options.execute ?? CONFIG_DEFAULT.execute,
        main: options.main ?? CONFIG_DEFAULT.main,
        push: options.push ?? CONFIG_DEFAULT.push,
        recursive: options.recursive ?? CONFIG_DEFAULT.recursive,
        showVersion: options.version ?? CONFIG_DEFAULT.showVersion,
        tag: options.tag ?? CONFIG_DEFAULT.tag,
        version: args[0],
        yes: options.yes ?? CONFIG_DEFAULT.yes,
    })

    isDebugEnable(parsedArgs)
    const set = await getGitignores(parsedArgs.cwd)
    for (const p of parsedArgs?.excludes ?? []) {
        set.add(p)
    }
    parsedArgs.excludes = [...set]
    if (typeof parsedArgs.execute === "string") {
        parsedArgs.execute = [parsedArgs.execute]
    }

    debug("parsedArgs:", parsedArgs)
    if (cli.options.help) {
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0)
    }
    return parsedArgs
}

export function parseCliCommand(commandString: string) {
    const regex = /[^\s"']+|(["'])(?:(?!\1)[^\\]|\\.)*\1/g
    return commandString.match(regex)?.map((arg) => {
        const unquoted = arg.replace(/^(["'`])(.*)\1$/, "$2")
        return unquoted.replaceAll(/\\(["'`])/g, "$1")
    }) ?? []
}
