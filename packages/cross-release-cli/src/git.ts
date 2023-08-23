import { execaSync } from "execa"
import { blue, gray, green } from "colorette"
import { spinner } from "@clack/prompts"

const s = spinner()

export function gitTag(tagName: string) {
  s.start("creating tag")
  if (!process.env.DRY) {
    execaSync("git", ["tag", tagName])
  }
  s.stop(`create git tag: ${blue(tagName)}`)
}

export function gitCommit(tagName: string, msg?: string) {
  s.start("committing")
  const innerMsg = msg ?? `chore: release ${tagName}`
  if (!process.env.DRY) {
    execaSync("git", ["commit", "-m", innerMsg])
  }
  s.stop(`commit message: ${green(innerMsg)}`)
}

export function gitPush() {
  s.start("pushing")
  const originUrl = getOriginUrl()
  if (!process.env.DRY) {
    execaSync("git", ["push", "--follow-tags"])
  }
  s.stop(`pushed to repo: ${gray(originUrl)}`)
}

export function getOriginUrl() {
  return execaSync("git", ["remote", "get-url", "origin"]).stdout
}
