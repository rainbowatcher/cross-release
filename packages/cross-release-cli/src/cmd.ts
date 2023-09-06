import * as path from "node:path"
import * as fs from "node:fs"
import cac from "cac"
import { defu } from "defu"
import { version } from "../package.json"
import type { ReleaseOptions } from "./types"



const configDefaults: ReleaseOptions = {
  showHelp: false,
  showVersion: false,
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
  commit: {
    shouldVerify: true,
    shouldStageAll: true,
    template: "chore: release v%s",
  },
  push: {
    shouldFollowTags: false,
  },
}

// TODO: should give more approches for config
export function loadUserConfig(overrides: Partial<ReleaseOptions>) {
  const file = fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
  const userConfig = JSON.parse(file)["cross-release"]
  return defu<ReleaseOptions, any>(overrides, userConfig, configDefaults)
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

export function parseOptions() {
  const cli = cac("cross-release")
    .version(version)
    .usage("[flags] version")
    .option("-r, --recursive", "Run the command for each project in the workspace (default: false)")
    .option("-d, --dry", "Dry run (default: false)")
    .option("-D, --dir [dir]", "Set working directory (default: project root)")
    .option("-p, --publish", "Publish the project (default: false)")
    .option("-c, --commit", "Commit current changes (default: false)")
    .option("-p, --push", "Push the project to remote (default: false)")
    .option("-t, --tag", "Create a tag for current version (default: false)")
    .option("-e, --exclude [dir]", "Folders to exclude from search (default: [node_modules, .git])")
    .option("-y, --yes", "Answer yes to all prompts (default: false)")
    .help()
    .parse()

  const { args, options } = cli
  const parsedArgs: ReleaseOptions = loadUserConfig({
    dir: options.dir,
    excludes: options.exclude,
    isRecursive: options.recursive,
    isDry: options.dry,
    isAllYes: options.yes,
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
