import path from "node:path"
import process from "node:process"
import cac from "cac"
import { getGitignores } from "cross-bump"
import { defu } from "defu"
import { loadConfig } from "unconfig"
import { version } from "../package.json"
import { CONFIG_DEFAULT } from "./constants"
import createDebug, { isDebugEnable } from "./util/debug"
import type { CAC } from "cac"
import type { KeysOf, ReleaseOptions } from "./types"

const debug = createDebug("cmd")

// TODO: should give more approches for config
export async function loadUserConfig(): Promise<Partial<ReleaseOptions>> {
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
    return userConfig
}

export function initCli(argv = process.argv) {
    const cli = cac("cross-release")
    cli.version(version)
        .usage("[version] [options]")
        .option("-c, --config [file]", "Config file (auto detect by default)")
        .option(
            "-D, --dry",
            "Dry run",
            { default: CONFIG_DEFAULT.dry },
        )
        .option(
            "-d, --debug",
            "Enable debug mode",
            { default: CONFIG_DEFAULT.debug },
        )
        .option("-e, --exclude [dir]", "Folders to exclude from search")
        .option(
            "-m, --main",
            "Base project language [e.g. java, rust, javascript]",
            { default: CONFIG_DEFAULT.main },
        )
        .option(
            "-r, --recursive",
            "Run the command for each project in the workspace",
            { default: CONFIG_DEFAULT.recursive },
        )
        .option(
            "-x, --execute.* [command]",
            "Execute the command",
            { default: CONFIG_DEFAULT.execute },
        )
        .option(
            "-y, --yes",
            "Answer yes to all prompts",
            { default: CONFIG_DEFAULT.yes },
        )
        .option(
            "--cwd [dir]",
            "Set working directory",
            { default: CONFIG_DEFAULT.cwd },
        )
        .option("--no-commit", "Skip committing changes")
        .option("--no-push", "Skip pushing")
        .option("--no-tag", "Skip tagging")
        .help()
        .parse(argv)
    return cli
}

export function toReleaseOptions(cli: CAC): ReleaseOptions {
    const { args, options } = cli
    return {
        commit: options.commit,
        config: options.config,
        cwd: options.cwd,
        debug: options.debug,
        dry: options.dry,
        excludes: options.excludes,
        execute: options.execute,
        main: options.main,
        push: options.push,
        recursive: options.recursive,
        tag: options.tag,
        version: args[0],
        yes: options.yes,
    }
}

export async function resolveOptions(cli: CAC): Promise<ReleaseOptions> {
    const cliOptions = toReleaseOptions(cli)
    const userConfig = await loadUserConfig()
    const parsedArgs = defu(cliOptions, userConfig)

    isDebugEnable(parsedArgs)

    // add gitignores
    const set = await getGitignores(parsedArgs.cwd)
    for (const i of parsedArgs.excludes) set.add(i)
    parsedArgs.excludes = [...set]

    // correct execute type to string array
    if (typeof parsedArgs.execute === "string") {
        parsedArgs.execute = [parsedArgs.execute]
    }

    // convert to absolute path
    const shouldBeAbsolute: Array<KeysOf<ReleaseOptions>> = ["cwd", "config"]
    for (const key of shouldBeAbsolute) {
        if (!parsedArgs[key]) continue
        if (key === "cwd") {
            const { cwd } = parsedArgs
            parsedArgs.cwd = path.isAbsolute(cwd) ? cwd : path.join(process.cwd(), cwd)
        }
        // @ts-expect-error type missmatch
        parsedArgs[key] = path.resolve(parsedArgs.cwd, parsedArgs[key])
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
