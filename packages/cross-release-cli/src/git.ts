import process from "node:process"
import { log, spinner } from "@clack/prompts"
import { execa } from "execa"
import color from "picocolors"
import createDebug from "./debug"

const debug = createDebug("git")

type GitTagOptions = {
    isDel?: boolean
    isForce?: boolean
    message?: string
}

export async function gitTag(tagName: string, options?: GitTagOptions): Promise<boolean> {
    const s = spinner()
    s.start("creating tag")
    const { isDel = false, isForce = false, message } = options ?? {}
    const args = []
    if (isDel) {
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

    if (isForce) args.push("--force")

    args.push(tagName)

    if (!process.env.DRY) {
        try {
            const { command } = await execa("git", ["tag", ...args])
            debug(`command: ${command}`)
        } catch (error: any) {
            s.stop(color.red(error.shortMessage))
            return false
        }
    }

    s.stop(`create git tag: ${color.blue(tagName)}`)
    return true
}

type GitCommitOptions = {
    modifiedFiles?: string[]
    shouldStageAll?: boolean
    shouldVerify?: boolean
}

export async function gitCommit(message: string, options?: GitCommitOptions): Promise<boolean> {
    const s = spinner()
    s.start("committing")
    const { modifiedFiles = [], shouldStageAll, shouldVerify } = options ?? {}
    const args = []

    if (process.env.DRY) {
        args.push("--dry-run")
    }

    args.push("--message", message)

    if (!shouldStageAll && modifiedFiles.length > 0) {
        args.push("--", ...modifiedFiles)
    } else {
        args.push("--all")
    }

    if (!shouldVerify) {
        args.push("--no-verify")
    }

    try {
        const { command } = await execa("git", ["commit", ...args])
        debug(`command: ${command}`)
        s.stop(`commit message: ${color.green(message)}`)
    } catch (error: any) {
        s.stop(color.red(error.shortMessage))
        return false
    }
    return true
}

type GitPushOptions = {
    branch?: string
    remote?: string
    shouldFollowTags?: boolean
}
export async function gitPush(options?: GitPushOptions): Promise<boolean> {
    const { branch, remote, shouldFollowTags = true } = options ?? {}
    const s = spinner()
    s.start("pushing")
    const originUrl = await gitOriginUrl()
    const args = []

    if (shouldFollowTags) {
        args.push("--follow-tags")
    }
    if (remote) {
        args.push(remote)
        if (branch) {
            args.push(branch)
        }
    }
    if (process.env.DRY) {
        args.push("--dry-run")
    }

    try {
        const { command } = await execa("git", ["push", ...args])
        debug(`command: ${command}`)
        s.stop(`pushed to repo: ${color.gray(originUrl)}`)
    } catch (error: any) {
        s.stop(color.red(error.shortMessage))
        return false
    }
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
}
export async function gitReset(options: GitResetOptions): Promise<boolean> {
    const { commit = "HEAD", files = [], mode = "mixed" } = options ?? {}
    const args = []

    args.push(mode, commit)
    if (files.length > 0) {
        args.push("--", ...files)
    }

    try {
        const { command } = await execa("git", ["reset", ...args])
        console.log(command)
    } catch {
        return false
    }
    return true
}

export async function gitHash(): Promise<string> {
    const command = await execa("git", ["rev-parse", "--short", "HEAD"])
    return command.stdout.trim()
}

export async function gitAdd(files: string[]): Promise<boolean> {
    const args = ["-A"]

    if (process.env.DRY) {
        args.push("--dry-run")
    }

    args.push("--", ...files)

    try {
        await execa("git", ["add", ...args])
    } catch {
        return false
    }
    return true
}
