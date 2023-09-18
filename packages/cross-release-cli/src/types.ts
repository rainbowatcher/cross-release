import type { ProjectCategory } from "cross-bump"

export type Status = "finished" | "failed" | "pending" | "running"

export type Task = {
  name: string
  exec: () => Promise<void | void[]> | void
}

export type ExecutionStatus = {
  upgrade: Task & { modifiedFiles: string[] }
  tag: Task & { tagName: string }
  commit: Task
  push: Task
  publish: Task
}

export type ReleaseContext = {
  options: ReleaseOptions
  currentVersion: string
  nextVersion: string
  modifiedFiles: string[]
  // TODO: record the task execution status to rollback when execution fails
  execution: Execution
}


export type Execution = {
  taskQueue: Task[]
  execIndex: number
  failIndex: number
}

export type ReleaseOptions = {
  /**
   * Specifies whether the operation should be performed recursively.
   * @default false
   */
  isRecursive: boolean

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
   * Whether all prompts requiring user input will be answered with "yes".
   * @default false
   */
  isAllYes: boolean

  /**
   * Whether the operation is being run in a dry-run mode (simulated execution).
   */
  isDry: boolean

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
   * The version string associated with the command or operation.
   */
  version: string

  /**
   * Whether the command should display the version information.
   */
  showVersion: boolean

  /**
   * Whether the command should display help or usage information.
   */
  showHelp: boolean

  /**
   * Specifies the main project category.
   */
  main: ProjectCategory

  /**
   * Git commit related options
   */
  commit: {
    /**
     * Whether to enable git pre-commit and commit-msg hook.
     * @default true
     */
    shouldVerify: boolean

    /**
     * Whether to stage all files or only modified files.
     */
    shouldStageAll: boolean

    /**
     * The template string for the commit message. if the template contains any "%s" placeholders,
     * then they are replaced with the version number;
     */
    template: string
  }

  /**
   * Git push related options
   */
  push: {
    /**
     * Whether to follow tags
     */
    shouldFollowTags: boolean
  }
};