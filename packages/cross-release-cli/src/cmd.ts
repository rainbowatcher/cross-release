import cac from "cac"
import { version } from "../package.json"

export type UserFlags = {
  /**
   * Specifies whether the operation should be performed recursively.
   */
  isRecursive: boolean

  /**
   * Indicates whether the user intends to publish the changes.
   */
  shouldPublish: boolean

  /**
   * Indicates whether the user intends to commit the changes.
   */
  shouldCommit: boolean

  /**
   * Indicates whether the user intends to push the changes to a remote repository.
   */
  shouldPush: boolean

  /**
   * Indicates whether the user intends to create a tag for a release.
   */
  shouldTag: boolean

  /**
   * Specifies whether all prompts requiring user input will be answered with "yes".
   */
  isAllYes: boolean

  /**
   * Specifies whether the operation is being run in a dry-run mode (simulated execution).
   */
  isDry: boolean
};


export type UserOptions = {
  /**
   * The directory path where the operation will be performed.
   */
  directory: string
};


type CommandArgs = {
  /**
   * Specifies whether the command should operate in quiet mode, suppressing unnecessary output.
   */
  isQuiet: boolean

  /**
   * The version string associated with the command or operation.
   */
  version: string

  /**
   * A collection of user-defined flags that control various aspects of the command.
   */
  flags: UserFlags

  /**
   * User-defined options that configure the behavior of the command.
   */
  options: UserOptions

  /**
   * Specifies whether the command should display the version information.
   */
  showVersion: boolean

  /**
   * Specifies whether the command should display help or usage information.
   */
  showHelp: boolean
};


export function parseArgs() {
  const cli = cac("cross-release")
    .version(version)
    .usage("[flags] version")
    .option("-r, --recursive", "Run the command for each project in the workspace (default: false)")
    .option("-d, --dry", "Dry run (default: false)")
    .option("-D, --dir", "Set working directory (default: project root)")
    .option("-p, --publish", "Publish the project (default: false)")
    .option("-c, --commit", "Commit message (default: false)")
    .option("-p, --push", "Push the project to remote (default: false)")
    .option("-t, --tag", "Create a tag for current version (default: false)")
    .option("-y, --yes", "Answer yes to all prompts (default: false)")
    .option("-q, --quiet", "Suppress all output")
    .help()
    .parse()

  const { args, options } = cli
  const parsedArgs: CommandArgs = {
    isQuiet: options.quiet ?? false,
    version: args[0] ?? "",
    showHelp: options.help ?? false,
    showVersion: options.version ?? false,
    flags: {
      isRecursive: options.recursive ?? false,
      isDry: options.dry ?? false,
      shouldPublish: options.publish ?? false,
      shouldCommit: options.commit ?? false,
      shouldPush: options.push ?? false,
      shouldTag: options.tag ?? false,
      isAllYes: options.yes ?? false,
    },
    options: {
      directory: options.dir ?? "",
    },
  }
  return parsedArgs
}
