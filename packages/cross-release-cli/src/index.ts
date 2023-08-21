import { intro, isCancel, log, outro } from "@clack/prompts"
import { blue, gray, inverse } from "colorette"
import {
  findProjectFile,
  findProjectFiles,
  getProjectVersion,
  isVersionValid,
  upgradeProjectVersion,
} from "cross-bump"
import isUnicodeSupported from "is-unicode-supported"
import { ExitCode } from "./exit-code"
import { chooseVersion, foo as confirmReleaseOptions, handleUserCancel } from "./prompt"
import { parseArgs } from "./cmd"
import { gitCommit, gitPush, gitTag } from "./git"

type Gav = {
  groupId: string
  artifactId: string
  version: string
  scope: string
}

async function main() {
  const parsedArgs = parseArgs()

  const { isQuiet, version, showHelp, showVersion, flags: options } = parsedArgs
  const { isRecursive, isDry, isAllYes } = options
  console.log({ isQuiet, version, showHelp, options })

  if (showHelp || showVersion)
    process.exit(ExitCode.Success)

  if (isQuiet)
    process.env.QUIET = "true"

  intro("Cross Release")
  if (isDry) {
    log.info(inverse(blue(" DRY RUN ")))
    process.env.DRY = "true"
  }
  const nextVersion = await getGivenVersion(version)

  if (!isAllYes) {
    await confirmReleaseOptions(options)
  }
  console.log({ options })
  const projectFiles = await getProjectFiles(isRecursive)

  for await (const projectFile of projectFiles) {
    if (!projectFile) {
      continue
    }
    await upgradeProjectVersion(projectFile, nextVersion)
    message(`upgrade version to ${blue(nextVersion)} for ${projectFile.path}`)
  }

  const tagName = `v${nextVersion}`
  gitTag(tagName)
  gitCommit(tagName)
  gitPush()

  outro("Done")
}

async function getProjectFiles(isRecursive: boolean) {
  let projectFiles = []
  if (isRecursive) {
    projectFiles = await findProjectFiles()
  } else {
    projectFiles = [await findProjectFile()]
  }
  return projectFiles
}

async function getGivenVersion(userSpecifyVersion: string): Promise<string> {
  let nextVersion
  // whether there are a version number is given
  if (isVersionValid(userSpecifyVersion)) {
    nextVersion = userSpecifyVersion
  } else {
    const projectFile = await findProjectFile()
    if (!projectFile) {
      throw new Error("can't found any project file in the project root")
    }

    const projectVersion = await getProjectVersion(projectFile)
    nextVersion = await chooseVersion(projectVersion)
  }
  if (isCancel(nextVersion)) {
    handleUserCancel()
  }
  log.message(`choose version: ${nextVersion as string}`)
  return nextVersion as string
}

export function message(msg: string): void {
  const bar = isUnicodeSupported() ? "│" : "|"
  console.log(`${gray(bar)} ${msg}`)
}

void main()
