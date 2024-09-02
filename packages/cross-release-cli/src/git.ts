import { log, spinner } from "@clack/prompts"
import { execaSync as createExeca } from "execa"
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

export function gitTag(options: GitTagOptions): boolean {
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
        const { exitCode, failed, shortMessage, stderr, stdout } = execa("git", ["tag", ...args])
        debug("git tag stdout:", stdout, stderr)
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

export function gitCommit(options: GitCommitOptions): boolean {
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

    !verify && args.push("--no-verify")

    if (!stageAll && modifiedFiles.length > 0) {
        args.push("--", ...modifiedFiles)
    } else {
        args.push("--all")
    }

    debug(`command: git commit ${args.join(" ")}`)
    if (!dry) {
        const { exitCode, failed, shortMessage, stderr, stdout } = execa("git", ["commit", ...args])
        debug("git commit stdout:", stdout, stderr)
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    }

    s.stop(`commit message: ${color.green(message)}`)
    return true
}

type GitPushOptions = {
    branch?: string
    followTags?: boolean
    remote?: string
} & DryAble

export function gitPush(options: GitPushOptions = {}): boolean {
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

    debug(`command: git push ${args.join(" ")}`)
    if (!dry) {
        const { exitCode, failed, shortMessage, stderr, stdout } = execa("git", ["push", ...args])
        debug("git push stdout:", stdout, stderr)
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    }
    const originUrl = gitOriginUrl()
    s.stop(`pushed to repo: ${color.underline(originUrl)}`)
    return true
}

export function gitOriginUrl(): string {
    const command = execa("git", ["remote", "get-url", "origin"])
    return command.stdout.trim()
}

type GitResetOptions = {
    commit?: string
    files?: string[]
    mode?: "hard" | "keep" | "merge" | "mixed" | "soft"
} & DryAble

export function gitReset(options: GitResetOptions): boolean {
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
        const { exitCode, failed, shortMessage, stderr, stdout } = execa("git", ["reset", ...args])
        debug("git reset stdout:", stdout, stderr)
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    }

    const hash = gitHash()
    s.stop(`reset to commit: ${color.blue(hash)}`)
    return true
}

export function gitHash(): string {
    const command = execa("git", ["rev-parse", "--short", "HEAD"])
    return command.stdout.trim()
}

type AddOptions = {
    all?: boolean
    files?: string[]
} & DryAble

export function gitAdd(options: AddOptions = {}): boolean {
    const {
        all = false,
        dry = false,
        files = [],
    } = options
    const args = []

    all && args.push("-A")
    files.length > 0 && args.push("--", ...files)

    debug("command: git add", args.join(" "))
    if (!dry) {
        const { failed, stderr, stdout } = execa("git", ["add", ...args])
        debug("git add stdout:", stdout, stderr)
        if (failed) {
            return false
        }
    }
    debug("add files:", files)
    return true
}
