import {
  cancel,
  intro,
  isCancel,
  log,
  outro,
} from "@clack/prompts"
import semver from "semver"
import { blue, inverse } from "colorette"
// @ts-expect-error type FIXME
import mri from "mri"
import { getJavaProjectVersion, upgradePomVersion } from "cross-bump"
import { findProjectFiles } from "../../cross-bump/src/project"
import { chooseVersion } from "./prompt"

type Gav = {
  groupId: string
  artifactId: string
  version: string
  scope: string
}

function usage() {
  const helpMessage = `\
  node scripts/reversion.js [options]
  
  --major        major version update
  --minor        minor version update
  --patch        patch version update
  --pre-major    preMajor version update
  --pre-minor    preMinor version update
  --pre-patch    prePatch version update
  --pre-release  preRelease version update
  --dry          dry run
  -h, --help     print help message
  `
  console.log(helpMessage)
}

async function main() {
  // parse arguments
  const args = process.argv.slice(2)
  const mriOpts = { alias: { h: "help" } }
  const argv = mri(args, mriOpts)
  if (argv.help) {
    usage()
    process.exit()
  }

  intro("Increase Version")

  if (argv.dry) {
    log.info(inverse(blue(" DRY RUN ")))
  }

  const { _: extraArgs } = argv

  let version
  // whether there are a version number is given
  if (extraArgs?.length && semver.valid(extraArgs[0])) {
    version = extraArgs[0]
  } else {
    // TODO
    const projectVersion = await getJavaProjectVersion("")
    version = await chooseVersion(argv, projectVersion)
  }
  if (isCancel(version)) {
    cancel("User cancel")
    return
  }

  const projectFiles = await findProjectFiles()
  for await (const projectFile of projectFiles) {
    switch (projectFile.category) {
      case "java":
        void upgradePomVersion(projectFile.path, version, argv.dry)
        break
      case "javascript":
        break
      case "rust":
        break
    }
  }

  outro("Done")
}

void main()
