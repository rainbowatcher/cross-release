import process from "node:process"
import type { ReleaseOptionsDefault } from "./types"

/**
 * CLI exit codes.
 *
 * @see https://nodejs.org/api/process.html#process_exit_codes
 */
export enum ExitCode {
    Canceled = 2,
    FatalError = 1,
    GitDirty = 3,
    InvalidArgument = 9,
    Success = 0,
}

export const CONFIG_DEFAULT: ReleaseOptionsDefault = {
    all: false,
    commit: {
        stageAll: false,
        template: "chore: release v%s",
        verify: true,
    },
    cwd: process.cwd(),
    debug: false,
    dry: false,
    exclude: ["node_modules", ".git"],
    execute: [],
    main: "javascript",
    push: {
        followTags: false,
    },
    recursive: false,
    tag: {
        template: "v%s",
    },
    yes: false,
}
