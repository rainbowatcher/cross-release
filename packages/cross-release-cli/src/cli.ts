import path from "node:path"
import process from "node:process"
import { toAbsolute } from "@rainbowatcher/path-extra"
import { Command } from "commander"
import { getGitignores } from "cross-bump"
import { defu } from "defu"
import { version } from "../package.json"
import { CONFIG_DEFAULT } from "./constants"
import { loadUserConfig, loadUserSpecifiedConfigFile } from "./util/config"
import createDebug, { isDebugEnable } from "./util/debug"
import type { CliReleaseOptions, KeysOf, ReleaseOptions } from "./types"

const debug = createDebug("cli")

export function createCliProgram() {
    const cli = new Command("cross-release")

    cli.configureHelp({
        subcommandTerm: cmd => `${cmd.name()} ${cmd.usage()}`,
    })

    cli.name("cross-release")
        .version(version)
        .description("A release tool that support multi programming language")
        .usage("[version] [options]")
        .option("-a, --all", "Add all changed files to staged", CONFIG_DEFAULT.commit.stageAll)
        .option("-c, --config [file]", "Config file (auto detect by default)")
        .option("-D, --dry", "Dry run", CONFIG_DEFAULT.dry)
        .option("-d, --debug", "Enable debug mode", CONFIG_DEFAULT.debug)
        .option("-e, --exclude [dir]", "Folders to exclude from search", CONFIG_DEFAULT.exclude)
        .option("-m, --main", "Base project language [e.g. java, rust, javascript]", CONFIG_DEFAULT.main)
        .option("-r, --recursive", "Run the command for each project in the workspace", CONFIG_DEFAULT.recursive)
        .option("-x, --execute [command...]", "Execute the command", CONFIG_DEFAULT.execute)
        .option("-y, --yes", "Answer yes to all prompts", CONFIG_DEFAULT.yes)
        .option("--cwd [dir]", "Set working directory", CONFIG_DEFAULT.cwd)
        .option("--no-commit", "Skip committing changes")
        .option("--no-push", "Skip pushing")
        .option("--no-tag", "Skip tagging")
        .option("-h, --help", "Display this message")

    return cli
}

export function toCliReleaseOptions(cli: Command): CliReleaseOptions {
    const { args } = cli
    const options = cli.opts<{ help: boolean } & CliReleaseOptions>()
    if (options.help) {
        cli.help()
    }
    return {
        ...options,
        ...args.length > 0 ? { version: args[0] } : {},
    }
}

export async function resolveOptions(cli: Command): Promise<ReleaseOptions> {
    const cliOptions = toCliReleaseOptions(cli)
    let userConfig: Partial<ReleaseOptions>
    if (cliOptions.config) {
        userConfig = await loadUserSpecifiedConfigFile(cliOptions.config, cliOptions)
    } else {
        userConfig = await loadUserConfig()
    }
    const parsedArgs = defu(cliOptions, userConfig)

    isDebugEnable(parsedArgs)

    // add gitignores
    const set = getGitignores(parsedArgs.cwd)
    for (const i of parsedArgs.exclude) set.add(i)
    parsedArgs.exclude = [...set]

    // convert to absolute path
    const shouldBeAbsolute: Array<KeysOf<ReleaseOptions>> = ["cwd", "config"]
    for (const key of shouldBeAbsolute) {
        if (!parsedArgs[key]) continue
        if (key === "cwd") {
            const { cwd } = parsedArgs
            parsedArgs.cwd = toAbsolute(cwd)
        }
        // @ts-expect-error type missmatch
        parsedArgs[key] = path.resolve(parsedArgs.cwd, parsedArgs[key])
    }

    debug("parsedArgs:", parsedArgs)
    return parsedArgs
}
