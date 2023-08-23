import type { PathLike } from "node:fs"
import { intro, isCancel, log, outro } from "@clack/prompts"
import { blue, gray, inverse } from "colorette"
import {
  findProjectFiles,
  getProjectVersion,
  isVersionValid,
  upgradeProjectVersion,
} from "cross-bump"
import isUnicodeSupported from "is-unicode-supported"
import { ExitCode } from "./exit-code"
import { chooseVersion, confirmReleaseOptions, handleUserCancel } from "./prompt"
import { parseArgs } from "./cmd"
import { gitCommit, gitPush, gitTag } from "./git"

type Gav = {
  groupId: string
  artifactId: string
  version: string
  scope: string
}

async function getVersion(dir: PathLike, excludes: string[], userSpecifyVersion: string): Promise<string> {
  let nextVersion
  // whether there are a version number is given
  if (isVersionValid(userSpecifyVersion)) {
    nextVersion = userSpecifyVersion
  } else {
    const projectFile = await findProjectFiles(dir, excludes)
    if (!projectFile.length) {
      throw new Error("can't found any project file in the project root")
    }

    const projectVersion = await getProjectVersion(projectFile[0])
    nextVersion = await chooseVersion(projectVersion)
  }
  if (isCancel(nextVersion)) {
    handleUserCancel()
  }
  return nextVersion as string
}

async function upgradeProjects(dir: PathLike, excludes: string[], isRecursive: boolean, nextVersion: string) {
  const projectFiles = await findProjectFiles(dir, excludes, isRecursive)
  const tasks = projectFiles.map((projectFile) => {
    if (projectFile) {
      return upgradeProjectVersion(nextVersion, projectFile).then(() => {
        message(`upgrade version to ${blue(nextVersion)} for ${gray(projectFile.path)}`)
      }).catch((e) => {
        log.error(e)
      })
    }
    return undefined
  })

  await Promise.all(tasks)
}

export function message(msg: string): void {
  const bar = isUnicodeSupported() ? "│" : "|"
  console.log(`${gray(bar)}  ${msg}`)
}

async function main() {
  const parsedArgs = parseArgs()
  const {
    isQuiet,
    dir,
    excludes,
    version,
    showHelp,
    showVersion,
    isRecursive,
    isDry,
    isAllYes,
  } = parsedArgs

  if (showHelp || showVersion)
    process.exit(ExitCode.Success)

  if (isQuiet)
    process.env.QUIET = "true"

  intro("Cross Release")
  if (isDry) {
    log.info(inverse(blue(" DRY RUN ")))
    process.env.DRY = "true"
  }
  const nextVersion = await getVersion(dir, excludes, version)

  if (!isAllYes) {
    await confirmReleaseOptions(parsedArgs)
  }

  await upgradeProjects(dir, excludes, isRecursive, nextVersion)

  const tagName = `v${nextVersion}`
  if (parsedArgs.shouldTag) gitTag(tagName)
  if (parsedArgs.shouldCommit) gitCommit(tagName)
  if (parsedArgs.shouldPush) gitPush()

  outro("Done")
}

void main()
