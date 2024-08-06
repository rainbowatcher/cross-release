import type { ProjectCategory } from "cross-bump"

export type Status = "failed" | "finished" | "pending" | "running"

export type ExtractBooleanKeys<T> = keyof Pick<T, { [K in keyof T]: T[K] extends boolean | Record<string, unknown> ? K : never }[keyof T]>

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

export type ReleaseOptionsDefault = Omit<ReleaseOptions, "config" | "excludes" | "version">

export type DefineConfigOptions = Partial<Omit<ReleaseOptions, "config">>

export type ReleaseOptions = {
    /**
     * Indicates whether to commit the changes.
     * @default false
     */
    commit: boolean | CommitOptions

    /**
     * Specifies the path to the configuration file.
     */
    config: string

    /**
     * The directory path where the operation will be performed.
     * @default process.cwd()
     */
    cwd: string

    /**
     * Whether the operation is being run in a dry-run mode (simulated execution).
     */
    dry: boolean

    /**
     * The list of directories to exclude from the search.
     * @default ["node_modules", ".git"]
     */
    excludes: string[]

    /**
     * Specifies the main project category.
     */
    main: ProjectCategory

    /**
     * Whether push changes to remote and push options
     * @default false
     */
    push: boolean | PushOptions

    /**
     * Specifies whether the operation should be performed recursively.
     * @default false
     */
    recursive: boolean

    /**
     * Whether the command should display the version information.
     */
    showVersion: boolean

    /**
     * Indicates whether to create a tag for a release.
     * @default false
     */
    tag: boolean | TagOptions

    /**
     * The version string associated with the command or operation.
     */
    version: string

    /**
     * Whether all prompts requiring user input will be answered with "yes".
     * @default false
     */
    yes: boolean
}

export type CommitOptions = {
    /**
     * Whether to stage all files or only modified files.
     */
    stageAll?: boolean

    /**
     * The template string for the commit message. if the template contains any "%s" placeholders,
     * then they are replaced with the version number;
     */
    template?: string

    /**
     * Whether to enable git pre-commit and commit-msg hook.
     * @default true
     */
    verify?: boolean
}

export type PushOptions = {
    /**
     * The branch name
     */
    branch?: string

    /**
     * Whether to follow tags
     */
    followTags?: boolean

    /**
     * The remote name
     */
    remote?: string
}

export type TagOptions = {
    /**
     * The template for tag name, same as @type {CommitOptions.template}
     * if the template contains any "%s" placeholders,
     * then they are replaced with the version number;
     */
    template?: string
}
