import { log, spinner } from "@clack/prompts"
import { execa as createExeca } from "execa"
import color from "picocolors"
import createDebug from "./util/debug"

const debug = createDebug("git")
const execa = createExeca({ reject: false })

type DryAble = {
    dry?: boolean
}

type GitTagOptions = {
    del?: boolean
    force?: boolean
    message?: string
    tagName: string
} & DryAble

export async function gitTag(options: GitTagOptions): Promise<boolean> {
    const {
        del = false,
        dry = false,
        force = false,
        message,
        tagName: name,
    } = options ?? {}
    const s = spinner()
    s.start("creating tag...")
    const args = []
    if (del) {
        args.push("--delete")
    } else {
        if (!message || message?.length === 0) {
            log.warn("no message provided, is recommended to provide a message for create an annotated tag")
        } else {
            args.push(
                // Create an annotated tag, which is recommended for releases.
                // See https://git-scm.com/docs/git-tag
                "--annotate",

                // Use the same commit message for the tag
                "--message",
                // formatMessageString(template, nextVersion),
                message,
            )
        }
    }

    if (force) args.push("--force")

    args.push(name)

    debug(`command: git tag ${args.join(" ")}`)
    if (!dry) {
        const { exitCode, failed, shortMessage } = await execa("git", ["tag", ...args])
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    }

    s.stop(`create git tag: ${color.blue(name)}`)
    return true
}

type GitCommitOptions = {
    message: string
    modifiedFiles?: string[]
    stageAll?: boolean
    verify?: boolean
} & DryAble

export async function gitCommit(options: GitCommitOptions): Promise<boolean> {
    const {
        dry = false,
        message,
        modifiedFiles = [],
        stageAll,
        verify,
    } = options ?? {}
    const s = spinner()
    s.start("committing...")
    const args = []

    args.push("--message", message)

    if (!stageAll && modifiedFiles.length > 0) {
        args.push("--", ...modifiedFiles)
    } else {
        args.push("--all")
    }

    dry && args.push("--dry-run")
    !verify && args.push("--no-verify")

    debug(`command: git commit ${args.join(" ")}`)
    const { exitCode, failed, shortMessage } = await execa("git", ["commit", ...args])
    if (failed) {
        s.stop(color.red(shortMessage), exitCode)
        return false
    }

    s.stop(`commit message: ${color.green(message)}`)
    return true
}

type GitPushOptions = {
    branch?: string
    followTags?: boolean
    remote?: string
} & DryAble

export async function gitPush(options: GitPushOptions = {}): Promise<boolean> {
    const { branch, dry, followTags = true, remote } = options
    const s = spinner()
    s.start("pushing...")
    const args = []

    if (remote) {
        args.push(remote)
        if (branch) {
            args.push(branch)
        }
    }

    followTags && args.push("--follow-tags")
    dry && args.push("--dry-run")

    debug(`command: git push ${args.join(" ")}`)
    const { exitCode, failed, shortMessage } = await execa("git", ["push", ...args])
    if (failed) {
        s.stop(color.red(shortMessage), exitCode)
        return false
    }

    const originUrl = await gitOriginUrl()
    s.stop(`pushed to repo ${color.underline(originUrl)}`)
    return true
}

export async function gitOriginUrl(): Promise<string> {
    const command = await execa("git", ["remote", "get-url", "origin"])
    return command.stdout.trim()
}

type GitResetOptions = {
    commit?: string
    files?: string[]
    mode?: "hard" | "keep" | "merge" | "mixed" | "soft"
} & DryAble

export async function gitReset(options: GitResetOptions): Promise<boolean> {
    const { commit = "HEAD", dry, files = [], mode = "mixed" } = options ?? {}
    const s = spinner()
    s.start("resetting...")
    const args = []

    args.push(mode, commit)
    if (files.length > 0) {
        args.push("--", ...files)
    }

    debug(`command: git reset ${args.join(" ")}`)
    if (!dry) {
        const { exitCode, failed, shortMessage } = await execa("git", ["reset", ...args])
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    }

    const hash = await gitHash()
    s.stop(`reset to commit: ${color.blue(hash)}`)
    return true
}

export async function gitHash(): Promise<string> {
    const command = await execa("git", ["rev-parse", "--short", "HEAD"])
    return command.stdout.trim()
}

type AddOptions = {
    all?: boolean
    files?: string[]
} & DryAble

export async function gitAdd(options: AddOptions = {}): Promise<boolean> {
    const {
        all = false,
        dry = false,
        files = [],
    } = options
    const s = spinner()
    s.start("adding files...")
    const args = []

    all && args.push("-A")
    dry && args.push("--dry-run")
    files.length > 0 && args.push("--", ...files)

    debug("command: git add", args.join(""))
    try {
        const { exitCode, failed, shortMessage } = await execa("git", ["add", ...args])
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    } catch (error: any) {
        s.stop(color.red(error.shortMessage), 1)
        return false
    }
    s.stop("added files")
    return true
}
