import { execa } from "execa"
import { blue, gray, green, red } from "colorette"
import { log, spinner } from "@clack/prompts"


type GitTagOptions = {
  isDel?: boolean
  isForce?: boolean
  message?: string
}

export async function gitTag(tagName: string, options?: GitTagOptions): Promise<boolean> {
  const s = spinner()
  s.start("creating tag")
  const { isForce = false, isDel = false, message } = options || {}
  const args = []
  if (isDel) {
    args.push("--delete")
  }
  else {
    if (!message || message?.length === 0) {
      log.warn("no message provided, is recommended to provide a message for create an annotated tag")
    }
    else {
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
      console.log(command)
    }
    catch (e: any) {
      s.stop(red(e.shortMessage))
      return false
    }
  }

  s.stop(`create git tag: ${blue(tagName)}`)
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
  const { modifiedFiles = [], shouldStageAll = true, shouldVerify = true } = options || {}
  const args = []

  if (process.env.DRY) {
    args.push("--dry-run")
  }

  args.push("--message", `"${message}"`)

  if (!shouldStageAll && modifiedFiles.length) {
    await gitAdd(modifiedFiles)
    args.push("--", ...modifiedFiles)
  }
  else {
    args.push("--all")
  }

  if (!shouldVerify) {
    args.push("--no-verify")
  }

  try {
    await execa("git", ["commit", ...args])
    s.stop(`commit message: ${green(message)}`)
  }
  catch (e: any) {
    s.stop(red(e.shortMessage))
    return false
  }
  return true
}

type GitPushOptions = {
  shouldFollowTags?: boolean
  remote?: string
  branch?: string
}
export async function gitPush(options?: GitPushOptions): Promise<boolean> {
  const { shouldFollowTags = true, remote, branch } = options || {}
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
    await execa("git", ["push", ...args])
    s.stop(`pushed to repo: ${gray(originUrl)}`)
  }
  catch (e: any) {
    s.stop(red(e.shortMessage))
    return false
  }
  return true
}

export async function gitOriginUrl(): Promise<string> {
  return (await execa("git", ["remote", "get-url", "origin"])).stdout.trim()
}

type GitResetOptions = {
  files?: string[]
  commit?: string
  mode?: "hard" | "soft" | "mixed" | "merge" | "keep"
}
export async function gitReset(options: GitResetOptions): Promise<boolean> {
  const { files = [], commit = "HEAD", mode = "mixed" } = options || {}
  const args = []

  args.push(mode)
  args.push(commit)
  if (files.length) {
    args.push("--", ...files)
  }

  try {
    const { command } = await execa("git", ["reset", ...args])
    console.log(command)
  }
  catch (e) {
    return false
  }
  return true
}

export async function gitHash(): Promise<string> {
  return (await execa("git", ["rev-parse", "--short", "HEAD"])).stdout.trim()
}

export async function gitAdd(files: string[]): Promise<boolean> {
  const args = ["-A"]

  if (process.env.DRY) {
    args.push("--dry-run")
  }

  args.push("--", ...files)

  try {
    await execa("git", ["add", ...args])
  }
  catch (e) {
    return false
  }
  return true
}