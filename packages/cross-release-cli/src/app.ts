import path from "node:path"
import process from "node:process"
import {
    cancel, confirm, intro, isCancel, log, outro,
} from "@clack/prompts"
import {
    findProjectFiles, getProjectVersion, isVersionValid, upgradeProjectVersion,
} from "cross-bump"
import isUnicodeSupported from "is-unicode-supported"
import color from "picocolors"
import { parseOptions } from "./cmd"
import createDebug from "./debug"
import { ExitCode } from "./exitCode"
import { gitCommit, gitPush, gitTag } from "./git"
import { chooseVersion } from "./prompt"
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
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(ExitCode.Canceled)
    }
    return result
}

export class App {

    private currentVersion = ""

    private modifiedFiles: string[] = []

    private nextVersion = ""

    private options: ReleaseOptions

    private taskQueue: Task[] = []

    private taskStatus: Status = "pending"

    constructor() {
        this.options = parseOptions()
    }

    /**
     * Accepts a message string template (e.g. "release %s" or "This is the %s release").
     * If the template contains any "%s" placeholders, then they are replaced with the version number;
     * otherwise, the version number is appended to the string.
     */
    formatMessageString(template: string, nextVersion: string): string {
        if (template.includes("%s")) {
            return template.replaceAll("%s", nextVersion)
        } else {
            return template + nextVersion
        }
    }

    // toString(): string {
    //     return this.currentVersion
    // }

    async run(): Promise<void> {
        this.#start()
        await this.#getNextVersion()
        await this.#getProjects()
        await this.#confirmReleaseOptions()
        for await (const task of this.taskQueue) {
            if (this.taskStatus === "failed") {
                break
            } else {
                await task.exec()
            }
        }
        this.#done()
    }

    #addTask(task: Task): boolean {
        const expect = this.taskQueue.length + 1
        return this.taskQueue.push(task) === expect
    }

    #check(status: boolean) {
        if (!status) {
            this.taskStatus = "failed"
        }
    }

    #checkDryRun() {
        if (this.options.isDry) {
            log.message(color.bgBlue(" DRY RUN "))
            process.env.DRY = "true"
        }
    }

    async #confirmReleaseOptions() {
        const { commit, isAllYes } = this.options


        const confirmAndSet = async (
            optionName: ExtractBooleanKeys<ReleaseOptions>,
            message: string,
            taskName: string,
            execFn: () => Promise<void> | void,
        ) => {
            if (isAllYes) {
                this.options[optionName] = true
            } else if (!this.options[optionName]) {
                const confirmation = await confirm({ message })
                this.options[optionName] = handleUserCancel<boolean>(confirmation)
            }

            if (this.options[optionName]) {
                this.#addTask({
                    exec: execFn,
                    name: taskName,
                })
            }
        }

        const message = this.formatMessageString(commit.template, this.nextVersion)
        await confirmAndSet("shouldCommit", "should commit?", "commit", async () => {
            this.#check(await gitCommit(message, {
                modifiedFiles: this.modifiedFiles,
                shouldStageAll: commit.shouldStageAll,
                shouldVerify: commit.shouldVerify,
            }))
        })

        const tagName = `v${this.nextVersion}`
        await confirmAndSet("shouldTag", "should create tag?", "tag", async () => {
            this.#check(await gitTag(tagName, { message }))
        })

        await confirmAndSet("shouldPush", "should push to remote?", "push", async () => {
            this.#check(await gitPush({ shouldFollowTags: this.options.push.shouldFollowTags }))
        })
    }

    #done(): void {
        outro("Done")
        this.taskStatus = "finished"
    }


    async #getNextVersion(): Promise<void> {
        const { dir, excludes, version } = this.options

        // read current project version
        // project file is in alphabetical order
        const projectFiles = await findProjectFiles(dir, excludes)
        if (projectFiles.length === 0) {
            throw new Error("can't found any project file in the project root")
        }
        const mainProjectFile = projectFiles.find(file => file.category === this.options.main)
        if (!mainProjectFile) {
            throw new Error(`can't found ${this.options.main} project file in the project root`)
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

    async #getProjects(): Promise<void> {
        const { nextVersion, options: { dir, excludes, isRecursive } } = this
        const projectFiles = await findProjectFiles(dir, excludes, isRecursive)
        debug(`found ${projectFiles.length} project files`)
        this.#addTask({
            exec: () => {
                return Promise.all(projectFiles.map(async (projectFile) => {
                    try {
                        await upgradeProjectVersion(nextVersion, projectFile)
                        this.modifiedFiles.push(projectFile.path)
                        message(`upgrade to ${color.blue(nextVersion)} for ${color.gray(path.relative(dir, projectFile.path))}`)
                    } catch (error) {
                        this.taskStatus = "failed"
                        log.error(String(error))
                    }
                }))
            },
            name: "upgradeVersion",
        })
    }

    #start(): void {
        intro("Cross release")
        this.#checkDryRun()
        this.taskStatus = "running"
    }

}

export default new App()
