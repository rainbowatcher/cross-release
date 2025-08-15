import process from "node:process"
import {
    cancel, confirm, intro, isCancel, log, outro,
} from "@clack/prompts"
import {
    findProjectFiles, getProjectVersion, isVersionValid, upgradeProjectVersion,
} from "cross-bump"
import { execaSync, parseCommandString } from "execa"
import isUnicodeSupported from "is-unicode-supported"
import color from "picocolors"
import { createCliProgram, resolveAppOptions } from "./cli"
import { resolveAltOptions } from "./config"
import { CONFIG_DEFAULT, ExitCode } from "./constants"
import {
    getStagedFiles,
    gitAdd, gitCommit, gitLsRemote, gitPush, gitTag,
    isGitClean,
} from "./git"
import { chooseVersion } from "./prompt"
import createDebug from "./util/debug"
import { formatMessageString } from "./util/str"
import type { ProjectFile } from "cross-bump"
import type {
    ExtractBooleanKeys, ReleaseOptions, Status, Task,
    TaskFn,
} from "./types"


const debug = createDebug("app")


function message(msg: string): void {
    const bar = isUnicodeSupported() ? "│" : "|"
    console.log(`${color.gray(bar)}  ${msg}`)
}

/**
 * Return the original result if it is not a cancellation symbol. exit process when detect cancel signal
 */
function handleUserCancel<T = boolean>(result: symbol | T): T {
    if (isCancel(result)) {
        cancel("User cancel")
        process.exit(ExitCode.Canceled)
    }
    return result
}

class App {
    private _currentVersion = ""

    private _modifiedFiles: string[] = []

    private _nextVersion = ""

    private _options: ReleaseOptions

    private _projectFiles: ProjectFile[] = []

    private _taskQueue: Task[] = []

    private _taskStatus: Status = "pending"

    public constructor(argv: string[] = process.argv) {
        const cli = createCliProgram(argv)
        if (cli.options.help) {
            process.exit(ExitCode.Success)
        }
        const opts = resolveAppOptions(cli)
        this._options = opts
    }

    #addTask(task: Task, idx?: number): boolean {
        const expect = this._taskQueue.length + 1
        if (idx) {
            this._taskQueue.splice(idx, 0, task)
        } else {
            this._taskQueue.push(task)
        }
        return this._taskQueue.length === expect
    }

    #check(status: boolean | boolean[]) {
        if (Array.isArray(status)) {
            if (status.some(s => !s)) {
                this._taskStatus = "failed"
            }
        } else if (!status) {
            this._taskStatus = "failed"
        }
    }

    #checkDryRun() {
        if (this._options.dry) {
            log.message(color.bgBlue(" DRY RUN "))
            process.env.DRY = "true"
        }
    }

    #done(): void {
        if (this._taskStatus === "failed") {
            outro(color.red("Error"))
            process.exit(ExitCode.FatalError)
        } else {
            outro("Done")
            this._taskStatus = "finished"
        }
    }


    #start(): void {
        intro("Cross release")
        this.#checkDryRun()
        this._taskStatus = "running"
    }


    checkGitClean(): void {
        const { cwd } = this._options
        const commit = resolveAltOptions(this._options, "commit")
        const isClean = isGitClean({ cwd })
        if (!isClean && !commit.stageAll) {
            log.warn("git is not clean, please commit or stash your changes")
            this.#done()
            process.exit(ExitCode.GitDirty)
        }
    }

    checkGitRemote(): void {
        const { cwd } = this._options
        const hasRemote = gitLsRemote({ cwd, mode: "branches" })
        if (!hasRemote) {
            log.warn("git remote not found, please add remote or check your network")
            this.#done()
            process.exit(ExitCode.GitUnreachable)
        }
    }

    async confirmReleaseOptions(): Promise<void> {
        const { cwd, dry, yes } = this._options

        const confirmTask = async (
            name: ExtractBooleanKeys<ReleaseOptions>,
            message: string,
            exec: TaskFn,
        ): Promise<void> => {
            if (yes) {
                if (!this._options[name]) return
                this._options[name] = true
            } else if (this._options[name]) {
                const confirmation = await confirm({ message })
                this._options[name] = handleUserCancel<boolean>(confirmation)
            }

            if (this._options[name]) {
                this.#addTask({ exec, name })
            }
        }


        let commitMessage: string | undefined
        if (this._options.commit) {
            const {
                stageAll,
                template,
                verify,
            } = resolveAltOptions(this._options, "commit", {
                ...CONFIG_DEFAULT.commit,
            })

            this.#addTask({
                exec: (): boolean => {
                    return gitAdd({
                        all: stageAll, cwd, dry, files: this._modifiedFiles,
                    })
                },
                name: "add",
            })

            commitMessage = formatMessageString(template!, this._nextVersion)
            await confirmTask("commit", "should commit?", (): boolean => {
                debug("staged files: %O", getStagedFiles({ cwd }))
                return gitCommit({
                    cwd,
                    dry,
                    message: commitMessage!,
                    modifiedFiles: stageAll ? undefined : this._modifiedFiles,
                    stageAll,
                    verify,
                })
            })
        }

        if (this._options.tag && commitMessage !== undefined) {
            const { template: tagTpt } = resolveAltOptions(this.options, "tag")
            await confirmTask("tag", "should create tag?", () => {
                const tagName = formatMessageString(tagTpt!, this._nextVersion)
                return gitTag({
                    cwd, dry, message: commitMessage, tagName,
                })
            })
        }

        if (this._options.push) {
            const { followTags } = resolveAltOptions(this._options, "push", CONFIG_DEFAULT.push)
            await confirmTask("push", "should push to remote?", () => {
                return gitPush({ cwd, dry, followTags })
            })
        }
    }

    async executeTasks(): Promise<void> {
        debug("taskQueue:", this._taskQueue)
        for (const task of this._taskQueue) {
            if (this._taskStatus === "failed") break
            // eslint-disable-next-line no-await-in-loop
            this.#check(await task.exec())
        }
    }

    resolveExecutes(): void {
        const { cwd, execute } = this._options
        const indexBeforeCommit = this._taskQueue.findIndex(t => t.name === "commit") - 1
        const index = indexBeforeCommit === -1 ? this._taskQueue.length : indexBeforeCommit
        for (const command of execute) {
            if (!command) continue
            const [cmd, ...args] = parseCommandString(command)
            if (!cmd) continue
            const exec = () => {
                debug("exec command: %s %s", cmd, args.join(" "))
                const { exitCode, failed, stdout } = execaSync(cmd, args, { cwd, reject: false })
                debug("exec stdout:", stdout, exitCode)
                if (failed) {
                    log.error(`exec: ${command}`)
                    return false
                } else {
                    log.success(`exec: ${command}`)
                    return true
                }
            }
            this.#addTask({ exec, name: "anonymous" }, index)
        }
    }

    async resolveNextVersion(): Promise<void> {
        const { main, version } = this._options

        const mainProjectFile = this._projectFiles.find(file => file.category === main)
        if (!mainProjectFile) {
            throw new Error(`can't found ${main} project file in the project root`)
        }
        const projectVersion = await getProjectVersion(mainProjectFile)
        this._currentVersion = projectVersion ?? ""

        // whether there are a version number is given
        if (isVersionValid(version)) {
            this._nextVersion = version
            log.info(`current version: ${this._currentVersion}, next version: ${color.blue(this._nextVersion)}`)
        } else {
            const nextVersion = await chooseVersion(this._currentVersion)
            this._nextVersion = handleUserCancel(nextVersion)
        }
    }

    resolveProjectFiles(): void {
        const { cwd, exclude, recursive } = this._options
        const projectFiles = findProjectFiles(cwd, exclude, recursive)
        if (projectFiles.length === 0) {
            console.error("can't found any project file in the project root")
            process.exit(ExitCode.FatalError)
        }
        debug(`found ${projectFiles.length} project files`)
        this._projectFiles = projectFiles
    }

    resolveProjects(): void {
        const { _nextVersion, _projectFiles } = this
        this.#addTask({
            exec: async () => {
                return await Promise.all(_projectFiles.map(async (projectFile) => {
                    try {
                        await upgradeProjectVersion(_nextVersion, projectFile)
                        this._modifiedFiles.push(projectFile.path)
                        message(`upgrade to ${color.blue(_nextVersion)} for ${color.gray(projectFile.path)}`)
                    } catch (error) {
                        log.error(String(error))
                        return false
                    }
                    return true
                }))
            },
            name: "upgradeVersion",
        })
    }

    async run(): Promise<void> {
        this.#start()
        this.checkGitClean()
        this.checkGitRemote()
        this.resolveProjectFiles()
        await this.resolveNextVersion()
        this.resolveProjects()
        await this.confirmReleaseOptions()
        this.resolveExecutes()
        await this.executeTasks()
        this.#done()
    }

    public get currentVersion(): string {
        return this._currentVersion
    }

    public get nextVersion(): string {
        return this._nextVersion
    }

    public get options(): ReleaseOptions {
        return this._options
    }

    public get projectFiles(): ProjectFile[] {
        return this._projectFiles
    }
}

export default App
