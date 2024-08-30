import path from "node:path"
import process from "node:process"
import {
    cancel, confirm, intro, isCancel, log, outro,
} from "@clack/prompts"
import {
    findProjectFiles, getProjectVersion, isVersionValid, upgradeProjectVersion,
} from "cross-bump"
import { execa } from "execa"
import isUnicodeSupported from "is-unicode-supported"
import color from "picocolors"
import { createCliProgram, parseCliCommand, resolveOptions } from "./cli"
import { CONFIG_DEFAULT, ExitCode } from "./constants"
import {
    gitAdd, gitCommit, gitPush, gitTag,
} from "./git"
import { chooseVersion } from "./prompt"
import { resolveAltOptions } from "./util/config"
import createDebug from "./util/debug"
import { formatMessageString } from "./util/str"
import type {
    ExtractBooleanKeys, ReleaseOptions, Status, Task,
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
    private currentVersion = ""

    private modifiedFiles: string[] = []

    private nextVersion = ""

    private options: ReleaseOptions

    private taskQueue: Task[] = []

    private taskStatus: Status = "pending"

    private constructor(opts: ReleaseOptions) {
        this.options = opts
    }

    static async create(): Promise<App> {
        const cli = createCliProgram().parse(process.argv)
        const opts = await resolveOptions(cli)
        return new App(opts)
    }

    #addTask(task: Task, idx?: number): boolean {
        const expect = this.taskQueue.length + 1
        if (idx) {
            this.taskQueue.splice(idx, 0, task)
        } else {
            this.taskQueue.push(task)
        }
        return this.taskQueue.length === expect
    }

    #check(status: boolean | boolean[]) {
        if (Array.isArray(status)) {
            if (status.some(s => !s)) {
                this.taskStatus = "failed"
            }
        } else if (!status) {
            this.taskStatus = "failed"
        }
    }

    #checkDryRun() {
        if (this.options.dry) {
            log.message(color.bgBlue(" DRY RUN "))
            process.env.DRY = "true"
        }
    }

    #done(): void {
        outro("Done")
        this.taskStatus = "finished"
    }


    #start(): void {
        intro("Cross release")
        this.#checkDryRun()
        this.taskStatus = "running"
    }


    async confirmReleaseOptions() {
        const { dry, yes } = this.options

        const confirmTask = async (
            name: ExtractBooleanKeys<ReleaseOptions>,
            message: string,
            exec: Task["exec"],
        ) => {
            if (yes) {
                this.options[name] = true
            } else if (this.options[name]) {
                const confirmation = await confirm({ message })
                this.options[name] = handleUserCancel<boolean>(confirmation)
            }

            if (this.options[name]) {
                this.#addTask({ exec, name })
            }
        }


        let commitMessage: string | undefined
        if (this.options.commit) {
            const { stageAll, template, verify } = resolveAltOptions(this.options, "commit", CONFIG_DEFAULT.commit)
            if (!stageAll) {
                this.#addTask({
                    exec: async () => {
                        return await gitAdd({ dry, files: this.modifiedFiles })
                    },
                    name: "add",
                })
            }
            commitMessage = formatMessageString(template!, this.nextVersion)
            await confirmTask("commit", "should commit?", async () => {
                return await gitCommit({
                    dry,
                    message: commitMessage!,
                    modifiedFiles: this.modifiedFiles,
                    stageAll,
                    verify,
                })
            })
        }

        if (this.options.tag && commitMessage !== undefined) {
            const { template } = resolveAltOptions(this.options, "tag", CONFIG_DEFAULT.tag)
            await confirmTask("tag", "should create tag?", async () => {
                const tagName = formatMessageString(template!, this.nextVersion)
                return await gitTag({ dry, message: commitMessage, tagName })
            })
        }

        if (this.options.push) {
            const { followTags } = resolveAltOptions(this.options, "push", CONFIG_DEFAULT.push)
            await confirmTask("push", "should push to remote?", async () => {
                return await gitPush({ dry, followTags })
            })
        }
    }

    async executeTasks() {
        debug("taskQueue:", this.taskQueue)
        for await (const task of this.taskQueue) {
            if (this.taskStatus === "failed") {
                break
            } else {
                this.#check(await task.exec())
            }
        }
    }

    async getNextVersion(): Promise<void> {
        const { cwd: dir, excludes, main, version } = this.options

        // read current project version
        // project file is in alphabetical order
        const projectFiles = await findProjectFiles(dir, excludes)
        if (projectFiles.length === 0) {
            throw new Error("can't found any project file in the project root")
        }
        const mainProjectFile = projectFiles.find(file => file.category === main)
        if (!mainProjectFile) {
            throw new Error(`can't found ${main} project file in the project root`)
        }
        const projectVersion = await getProjectVersion(mainProjectFile)
        this.currentVersion = projectVersion ?? ""

        // whether there are a version number is given
        if (isVersionValid(version)) {
            this.nextVersion = version
        } else {
            const nextVersion = await chooseVersion(this.currentVersion)
            this.nextVersion = handleUserCancel(nextVersion)
        }
    }

    resolveExecutes() {
        const { execute } = this.options
        const indexBeforePush = this.taskQueue.findIndex(t => t.name === "push")
        const index = indexBeforePush === -1 ? this.taskQueue.length : indexBeforePush
        for (const command of execute) {
            if (!command) continue
            const [cmd, ...args] = parseCliCommand(command)
            if (!cmd) continue
            const exec = async () => {
                const { failed, stdout } = await execa(cmd, args, { reject: false })
                debug("stdout:", stdout)
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

    async resolveProjects(): Promise<void> {
        const { nextVersion, options: { cwd: dir, excludes, recursive } } = this
        const projectFiles = await findProjectFiles(dir, excludes, recursive)
        debug(`found ${projectFiles.length} project files`)
        this.#addTask({
            exec: async () => {
                return await Promise.all(projectFiles.map(async (projectFile) => {
                    try {
                        await upgradeProjectVersion(nextVersion, projectFile)
                        this.modifiedFiles.push(projectFile.path)
                        message(`upgrade to ${color.blue(nextVersion)} for ${color.gray(path.relative(dir, projectFile.path))}`)
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
        await this.getNextVersion()
        await this.resolveProjects()
        await this.confirmReleaseOptions()
        this.resolveExecutes()
        await this.executeTasks()
        this.#done()
    }
}

const app = await App.create()

await app.run()
