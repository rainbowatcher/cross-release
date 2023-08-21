import { execaSync } from "execa"
import { blue, green } from "colorette"
import { log } from "@clack/prompts"

export function gitTag(tagName: string) {
  if (!process.env.DRY) {
    execaSync("git", ["tag", tagName])
  }
  log.info(`create tag ${blue(tagName)}`)
}

export function gitCommit(tagName: string, msg?: string) {
  const innerMsg = msg ?? `chore: release ${tagName}`
  if (!process.env.DRY) {
    execaSync("git", ["commit", "-m", innerMsg])
  }
  log.info(`commit message: ${green(innerMsg)}`)
}

export function gitPush() {
  if (!process.env.DRY) {
    execaSync("git", ["push", "--follow-tags"])
  }
  log.info("push to git repository")
}