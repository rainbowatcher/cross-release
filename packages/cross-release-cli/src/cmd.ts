import * as path from "node:path"
import * as fs from "node:fs"
import cac from "cac"
import { defu } from "defu"
import { version } from "../package.json"

export type CommandArgs = {
  /**
   * Specifies whether the operation should be performed recursively.
   * @default false
   */
  isRecursive: boolean

  /**
   * Indicates whether the user intends to publish the changes.
   * @default false
   */
  shouldPublish: boolean

  /**
   * Indicates whether the user intends to commit the changes.
   * @default false
   */
  shouldCommit: boolean

  /**
   * Indicates whether the user intends to push the changes to a remote repository.
   * @default false
   */
  shouldPush: boolean

  /**
   * Indicates whether the user intends to create a tag for a release.
   * @default false
   */
  shouldTag: boolean

  /**
   * Specifies whether all prompts requiring user input will be answered with "yes".
   * @default false
   */
  isAllYes: boolean

  /**
   * Specifies whether the operation is being run in a dry-run mode (simulated execution).
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
   * Specifies whether the command should operate in quiet mode, suppressing unnecessary output.
   */
  isQuiet: boolean

  /**
   * The version string associated with the command or operation.
   */
  version: string

  /**
   * Specifies whether the command should display the version information.
   */
  showVersion: boolean

  /**
   * Specifies whether the command should display help or usage information.
   */
  showHelp: boolean
};

const configDefaults: CommandArgs = {
  showHelp: false,
  showVersion: false,
  isQuiet: false,
  version: "",
  isAllYes: false,
  isDry: false,
  isRecursive: false,
  shouldCommit: false,
  shouldPublish: false,
  shouldPush: false,
  shouldTag: false,
  excludes: ["node_modules", ".git"],
  dir: process.cwd(),
}

// TODO: should give more approches for config
export function loadUserConfig(overrides: CommandArgs): CommandArgs {
  const file = fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
  const userConfig = JSON.parse(file)["cross-release"]
  return defu(overrides, userConfig, configDefaults)
}

function filterNull(obj: any) {
  return Object.entries(obj).reduce((result, [key, value]) => {
    if (value !== undefined) {
      // @ts-expect-error implicitly any
      result[key] = value
    }
    return result
  }, {})
}

export function parseArgs() {
  const cli = cac("cross-release")
    .version(version)
    .usage("[flags] version")
    .option("-r, --recursive", "Run the command for each project in the workspace (default: false)")
    .option("-d, --dry", "Dry run (default: false)")
    .option("-D, --dir [dir]", "Set working directory (default: project root)")
    .option("-p, --publish", "Publish the project (default: false)")
    .option("-c, --commit", "Commit message (default: false)")
    .option("-p, --push", "Push the project to remote (default: false)")
    .option("-t, --tag", "Create a tag for current version (default: false)")
    .option("-e, --exclude [dir]", "Suppress all output")
    .option("-y, --yes", "Answer yes to all prompts (default: false)")
    .option("-q, --quiet", "Suppress all output")
    .help()
    .parse()

  const { args, options } = cli
  const parsedArgs: CommandArgs = loadUserConfig({
    dir: options.dir,
    excludes: options.exclude,
    isRecursive: options.recursive,
    isDry: options.dry,
    isAllYes: options.yes,
    isQuiet: options.quiet,
    showHelp: options.help,
    showVersion: options.version,
    shouldCommit: options.commit,
    shouldPublish: options.publish,
    shouldPush: options.push,
    shouldTag: options.tag,
    version: args[0],
  })
  return parsedArgs
}
