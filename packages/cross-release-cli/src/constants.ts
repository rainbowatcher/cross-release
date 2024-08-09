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
    InvalidArgument = 9,
    Success = 0,
}

export const CONFIG_DEFAULT: ReleaseOptionsDefault = {
    commit: {
        stageAll: false,
        template: "chore: release v%s",
        verify: true,
    },
    cwd: process.cwd(),
    dry: false,
    main: "javascript",
    push: {
        followTags: false,
    },
    recursive: false,
    showVersion: false,
    tag: {
        template: "v%s",
    },
    version: "",
    yes: false,
}
