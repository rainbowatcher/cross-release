import type { ProjectCategory } from "cross-bump"

export type Arrayable<T> = T | T[]

export type CliPrimitive = boolean | string | string[]

export type ExcludeType<T, U> = {
    [K in keyof T]: T[K] extends U ? T[K] : Exclude<T[K], U>
}

export type KeysOf<T, KeyType = string> = keyof { [K in keyof T as T[K] extends KeyType ? K : never]: T[K] }

export type ResolvedOptions<T> = T extends boolean
    ? never
    : NonNullable<T>

export type Status = "failed" | "finished" | "pending" | "running"

export type ExtractBooleanKeys<T> = keyof Pick<T, { [K in keyof T]: T[K] extends boolean | Record<string, unknown> ? K : never }[keyof T]>

export type Task = {
    exec: () => boolean | boolean[] | Promise<boolean | boolean[]>
    name: string
}

export type ReleaseOptionsDefault = Omit<ExcludeType<ReleaseOptions, CliPrimitive>, "config" | "version">

export type DefineConfigOptions = Partial<Omit<ReleaseOptions, "config">>

export type CliReleaseOptions = ExcludeType<ReleaseOptions, Record<string, unknown>>

export type ReleaseOptions = {
    /**
     * Wethere add all changed files to staged, shorthand for @type {CommitOptions.stageAll}
     */
    all: boolean

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
     * Enable debug log
     */
    debug: boolean

    /**
     * Whether the operation is being run in a dry-run mode (simulated execution).
     */
    dry: boolean

    /**
     * The list of directories to exclude from the search.
     * @default ["node_modules", ".git"]
     */
    exclude: string[]

    /**
     * The command to execute before pushing.
     */
    execute: string[]

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
