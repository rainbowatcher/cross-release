import debug from "debug"

export default function createDebug(ns: string) {
  return debug(`cross-release-cli:${ns}`)
}