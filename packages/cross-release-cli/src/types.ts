import type { ProjectCategory } from "cross-bump"

export type Status = "failed" | "finished" | "pending" | "running"

export type ExtractBooleanKeys<T> = keyof Pick<T, { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T]>

export type Task = {
    exec: () => Promise<void | void[]> | void
    name: string
}

export type ExecutionStatus = {
    commit: Task
    publish: Task
    push: Task
    tag: { tagName: string } & Task
    upgrade: { modifiedFiles: string[] } & Task
}

export type ReleaseContext = {
    currentVersion: string
    // TODO: record the task execution status to rollback when execution fails
    execution: Execution
    modifiedFiles: string[]
    nextVersion: string
    options: ReleaseOptions
}


export type Execution = {
    execIndex: number
    failIndex: number
    taskQueue: Task[]
}

export type ReleaseOptions = {
    /**
     * Git commit related options
     */
    commit: CommitOptions

    /**
     * The directory path where the operation will be performed.
     * @default process.cwd()
     */
    dir: string

    /**
     * The list of directories to exclude from the search.
     * @default ["node_modules", ".git"]
     */
    excludes: string[]

    /**
     * Whether all prompts requiring user input will be answered with "yes".
     * @default false
     */
    isAllYes: boolean

    /**
     * Whether the operation is being run in a dry-run mode (simulated execution).
     */
    isDry: boolean

    /**
     * Specifies whether the operation should be performed recursively.
     * @default false
     */
    isRecursive: boolean

    /**
     * Specifies the main project category.
     */
    main: ProjectCategory

    /**
     * Git push related options
     */
    push: {
        /**
         * Whether to follow tags
         */
        shouldFollowTags: boolean
    }

    /**
     * Indicates whether to commit the changes.
     * @default false
     */
    shouldCommit: boolean

    /**
     * Indicates whether to push the changes to a remote repository.
     * @default false
     */
    shouldPush: boolean

    /**
     * Indicates whether to create a tag for a release.
     * @default false
     */
    shouldTag: boolean

    /**
     * Whether the command should display help or usage information.
     */
    showHelp: boolean

    /**
     * Whether the command should display the version information.
     */
    showVersion: boolean

    /**
     * The version string associated with the command or operation.
     */
    version: string
}

export type CommitOptions = {
    /**
     * Whether to stage all files or only modified files.
     */
    shouldStageAll: boolean

    /**
     * Whether to enable git pre-commit and commit-msg hook.
     * @default true
     */
    shouldVerify: boolean

    /**
     * The template string for the commit message. if the template contains any "%s" placeholders,
     * then they are replaced with the version number;
     */
    template: string
}
