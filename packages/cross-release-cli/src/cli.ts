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
import { CONFIG_DEFAULT, ExitCode } from "./constants"
import { gitCommit, gitPush, gitTag } from "./git"
import { chooseVersion } from "./prompt"
import { resolveAltOptions } from "./util/config"
import createDebug from "./util/debug"
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
    static async create(): Promise<App> {
        const opts = await parseOptions()
        return new App(opts)
    }

    private currentVersion = ""

    private modifiedFiles: string[] = []

    private nextVersion = ""

    private options: ReleaseOptions

    private taskQueue: Task[] = []

    private taskStatus: Status = "pending"

    constructor(opts: ReleaseOptions) {
        this.options = opts
    }

    /**
     * Accepts a message string template (e.g. "release %s" or "This is the %s release").
     * If the template contains any "%s" placeholders, then they are replaced with the version number;
     * otherwise, the version number is appended to the string.
     */
    formatMessageString(template: string, nextVersion: string): string {
        return template?.includes("%s") ? template.replaceAll("%s", nextVersion) : template + nextVersion
    }

    async run(): Promise<void> {
        this.#start()
        await this.#getNextVersion()
        await this.#getProjects()
        await this.#confirmReleaseOptions()
        debug("taskQueue:", this.taskQueue)
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
        if (!status) this.taskStatus = "failed"
    }

    #checkDryRun() {
        if (this.options.dry) {
            log.message(color.bgBlue(" DRY RUN "))
            process.env.DRY = "true"
        }
    }

    // TODO: refactor this function
    async #confirmReleaseOptions() {
        const { dry, yes } = this.options

        const confirmTask = async (
            name: ExtractBooleanKeys<ReleaseOptions>,
            message: string,
            exec: () => Promise<void> | void,
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
            commitMessage = this.formatMessageString(template!, this.nextVersion)
            await confirmTask("commit", "should commit?", async () => {
                this.#check(await gitCommit({
                    dry,
                    message: commitMessage!,
                    modifiedFiles: this.modifiedFiles,
                    stageAll,
                    verify,
                }))
            })
        }

        if (this.options.tag && commitMessage !== undefined) {
            const { template } = resolveAltOptions(this.options, "tag", CONFIG_DEFAULT.tag)
            await confirmTask("tag", "should create tag?", async () => {
                const tagName = this.formatMessageString(template!, this.nextVersion)
                this.#check(await gitTag({ dry, message: commitMessage, tagName }))
            })
        }

        if (this.options.push) {
            const { followTags } = resolveAltOptions(this.options, "push", CONFIG_DEFAULT.push)
            await confirmTask("push", "should push to remote?", async () => {
                this.#check(await gitPush({ dry, followTags }))
            })
        }
    }

    #done(): void {
        outro("Done")
        this.taskStatus = "finished"
    }


    async #getNextVersion(): Promise<void> {
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

    async #getProjects(): Promise<void> {
        const { nextVersion, options: { cwd: dir, excludes, recursive } } = this
        const projectFiles = await findProjectFiles(dir, excludes, recursive)
        debug(`found ${projectFiles.length} project files`)
        this.#addTask({
            exec: async () => {
                await Promise.all(projectFiles.map(async (projectFile) => {
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

const app = await App.create()

await app.run()
