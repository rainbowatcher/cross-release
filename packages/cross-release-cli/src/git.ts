import process from "node:process"
import { log, spinner } from "@clack/prompts"
import { execaSync as createExeca } from "execa"
import color from "picocolors"
import createDebug from "./util/debug"

const debug = createDebug("git")
const execa = createExeca({ all: true, reject: false })

type DryAble = {
    dry?: boolean
}

type CwdOption = {
    cwd?: string
}

type GitLsRemoteOptions = {
    mode?: "branches" | "refs" | "tags"
    pattern?: string
    remote?: string
    repository?: string
} & CwdOption & DryAble

export function gitLsRemote(options: GitLsRemoteOptions) {
    const {
        cwd = process.cwd(),
        dry = false,
        mode = "branches",
        pattern,
        remote,
        repository = "origin",
    } = options
    const s = spinner()
    s.start("listing remote...")
    const args = []
    if (remote) args.push(remote)
    if (mode) args.push(`--${mode}`)
    args.push(repository)
    if (pattern) args.push(pattern)

    debug(`command: git ls-remote ${args.join(" ")}`)
    if (!dry) {
        const { all, exitCode, failed, shortMessage } = execa("git", ["ls-remote", ...args], { cwd })
        debug("git ls-remote stdout:", all)
        if (failed) {
            s.stop(color.red(shortMessage), exitCode)
            return false
        }
    }
    s.stop(`listed remote`)
    return true
}

type GitTagOptions = {
    del?: boolean
    force?: boolean
    message?: string
    tagName: string
} & CwdOption & DryAble

export function gitTag(options: GitTagOptions): boolean {
    const {
        cwd = process.cwd(),
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
        const { all, exitCode, failed, shortMessage } = execa("git", ["tag", ...args], { cwd })
        debug("git tag stdout:", all)
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
    signoff?: boolean
    stageAll?: boolean
    verify?: boolean
} & CwdOption & DryAble

export function gitCommit(options: GitCommitOptions): boolean {
    const {
        cwd = process.cwd(),
        dry = false,
        message,
        modifiedFiles = [],
        signoff,
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

    if (signoff) {
        args.push("--signoff")
    }

    debug(`command: git commit ${args.join(" ")}`)
    if (!dry) {
        const { all, exitCode, failed, shortMessage } = execa("git", ["commit", ...args], { cwd })
        debug("git commit stdout: %s", all)
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
} & CwdOption & DryAble

export function gitPush(options: GitPushOptions = {}): boolean {
    const {
        branch,
        cwd = process.cwd(),
        dry,
        followTags = true,
        remote,
    } = options
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
        const { all, exitCode, failed, shortMessage } = execa("git", ["push", ...args], { cwd })
        debug("git push stdout: %s", all)
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

export function gitReset(options: GitResetOptions = {}): boolean {
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
        const { all, exitCode, failed, shortMessage } = execa("git", ["reset", ...args])
        debug("git reset stdout:", all)
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
} & CwdOption & DryAble

export function gitAdd(options: AddOptions = {}): boolean {
    const {
        all = false,
        cwd = process.cwd(),
        dry = false,
        files = [],
    } = options
    const args = []

    if (all) {
        args.push("--all")
    } else if (files.length > 0) {
        args.push("--", ...files)
    }

    debug("command: git add", args.join(" "))
    if (!dry) {
        const { all, failed } = execa("git", ["add", ...args], { cwd })
        debug("git add stdout:", all)
        if (failed) {
            return false
        }
    }

    return true
}

type IsGitCleanOptions = CwdOption

export function isGitClean(options: IsGitCleanOptions = {}): boolean {
    const { cwd = process.cwd() } = options
    const args = ["status", "--porcelain"]
    const { all, failed } = execa("git", args, { cwd })
    if (all) {
        return false
    }
    return !failed
}

type StageFilesOptions = CwdOption

/**
 * `-z`: use NUL termination instead of newline
 * @see https://git-scm.com/docs/diff
 */
export function getStagedFiles(opts: StageFilesOptions = {}) {
    const { cwd } = opts
    let stagedArr: string[] = []
    const args = ["--name-only", "--staged", "-z", "--diff-filter=ACMR"]

    debug("command: git diff", args.join(" "))
    const { all, failed } = execa("git", ["diff", ...args], { cwd })

    if (!failed) {
        stagedArr = all.replace(/\0$/, "").split("\0")
    }

    return stagedArr
}

export function getGitVersion(opts: CwdOption = {}) {
    const { cwd } = opts
    const args = ["--build-options"]
    const { all } = execa("git", ["version", ...args], { cwd })
    return all
}
