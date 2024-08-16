import debug from "debug"
import type { Debugger } from "debug"
import type { ReleaseOptions } from "../types"

export default function createDebug(ns: string): Debugger {
    return debug(`cross-release-cli:${ns}`)
}

export function isDebugEnable(options: ReleaseOptions): void {
    if (options.debug) {
        debug.enable("cross-release-cli:*")
    }
}
