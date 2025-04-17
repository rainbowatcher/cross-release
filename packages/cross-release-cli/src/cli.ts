import path from "node:path"
import process from "node:process"
import { toAbsolute } from "@rainbowatcher/path-extra"
import cac from "cac"
import { getGitignores } from "cross-bump"
import { loadUserConfig } from "./config"
import { CONFIG_DEFAULT, ExitCode } from "./constants"
import { toArray } from "./util/array"
import createDebug, { setupDebug } from "./util/debug"
import { merge } from "./util/merge"
import { cliOptions as cliOptionsSchema } from "./zod"
import { version } from "../package.json"
import type { KeysOf, ParsedArgv, ReleaseOptions } from "./types"

const debug = createDebug("cli")

export function createCliProgram(argv: string[]): ParsedArgv {
    const cli = cac("cross-release")
        .usage("A release tool that support multi programming language")
        .version(version)
        .usage("[version] [options]")
        .option("-c, --config [file]", "Config file (auto detect by default)")
        .option("-D, --dry", "Dry run")
        .option("-d, --debug", "Enable debug mode")
        .option("-e, --exclude [dir...]", "Folders to exclude from search")
        .option("-m, --main [lang]", "Base project language [e.g. java, rust, javascript]")
        .option("-r, --recursive", "Run the command for each project in the workspace")
        .option("-x, --execute [command...]", "Execute the command")
        .option("-y, --yes", "Answer yes to all prompts")
        .option("--cwd [dir]", "Set working directory")
        .option("--commit", "Committing changes")
        .option("--commit.signoff", "Pushing Commit with signoff")
        .option("--commit.stageAll", "Stage all changes before pushing")
        .option("--commit.template <template>", "Template for commit message")
        .option("--commit.verify", "Verify commit message")
        .option("--push", "Pushing Commit to remote")
        .option("--push.followTags", "Pushing with follow tags")
        .option("--push.branch <branch>", "Branch name to push")
        .option("--push.followTags", "pushing with follow tags")
        .option("--tag", "Tagging for release")
        .option("--tag.template <template>", "Template for tag message")
        .option("-h, --help", "Display this message")
        .help()

    return cli.parse(argv)
}

export function argvToReleaseOptions(cli: ParsedArgv): ReleaseOptions {
    const { args, options } = cli
    const opts = {
        commit: options.commit,
        config: options.config,
        cwd: options.cwd,
        debug: options.debug,
        dry: options.dry,
        exclude: toArray(options.exclude),
        execute: toArray(options.execute),
        main: options.main,
        push: options.push,
        recursive: options.recursive,
        tag: options.tag,
        version: options.version,
        yes: options.yes,
        ...args.length > 0 ? { version: args[0] } : {},
    } satisfies ReleaseOptions
    debug("cli options: %O", opts)
    return opts
}

function pathToAbs(opts: ReleaseOptions) {
    const shouldBeAbsolute: Array<KeysOf<ReleaseOptions>> = ["cwd", "config"]
    for (const key of shouldBeAbsolute) {
        if (!opts[key]) continue
        if (key === "cwd") {
            opts.cwd = toAbsolute(opts.cwd)
        }
        // @ts-expect-error type missmatch
        opts[key] = path.resolve(opts.cwd, opts[key])
    }
}

function resolveGitIgnore(opts: ReleaseOptions) {
    const ignoresSet = getGitignores(opts.cwd)
    for (const i of opts.exclude) { ignoresSet.add(i) }
    opts.exclude = [...ignoresSet]
}

function validateOptions(cli: ReleaseOptions) {
    const result = cliOptionsSchema.safeParse(cli)
    if (!result.success) {
        const formatted = result.error.format()
        let errorMsg = ""
        for (const [key, val] of Object.entries(formatted)) {
            if (key === "_errors") continue
            errorMsg = `${(val as any)._errors[0]} for key \`${key}\``
        }
        console.error(errorMsg)
        process.exit(ExitCode.FatalError)
    }
}

export function resolveAppOptions(cli: ParsedArgv): ReleaseOptions {
    const opts = argvToReleaseOptions(cli)
    const userConfig = loadUserConfig(opts)
    const crOptions = merge(CONFIG_DEFAULT, userConfig, opts) as ReleaseOptions
    validateOptions(crOptions)
    setupDebug(crOptions)
    resolveGitIgnore(crOptions)
    pathToAbs(crOptions)
    debug("resolved app options: %O", crOptions)
    return crOptions
}
