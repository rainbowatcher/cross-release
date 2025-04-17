import process from "node:process"
import { DEFAULT_IGNORED_GLOBS } from "cross-bump"
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
    commit: {
        signoff: true,
        stageAll: false,
        template: "chore: release v%s",
        verify: true,
    },
    cwd: process.cwd(),
    debug: false,
    dry: false,
    exclude: DEFAULT_IGNORED_GLOBS,
    execute: [],
    main: "javascript",
    push: {
        branch: undefined,
        followTags: true,
        remote: undefined,
    },
    recursive: false,
    tag: {
        template: "v%s",
    },
    yes: false,
}
