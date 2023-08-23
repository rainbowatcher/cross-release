import { getNextVersions, isVersionValid, parseVersion } from "cross-bump"
import { cancel, confirm, isCancel, select, text } from "@clack/prompts"
import { ExitCode } from "./exit-code"
import type { CommandArgs } from "./cmd"

/**
 * Generates the version to be chosen based on command line arguments and project version.
 *
 * @param argv - The command line arguments.
 * @param projectVersion - The project version.
 * @return The chosen version.
 */
export async function chooseVersion(projectVersion?: string): Promise<string | symbol> {
  const versionObj = parseVersion(projectVersion)
  const {
    nextMajor,
    nextMinor,
    nextPatch,
    nextRelease,
    nextPreMajor,
    nextPreMinor,
    nextPrePatch,
  } = getNextVersions(versionObj ?? undefined)

  const C_CUSTOM = "custom"
  const versions = [
    { label: "custom...", value: C_CUSTOM },
    { label: `next (${nextRelease})`, value: nextRelease },
    { label: `patch (${nextPatch})`, value: nextPatch },
    { label: `minor (${nextMinor})`, value: nextMinor },
    { label: `major (${nextMajor})`, value: nextMajor },
    {
      label: `patch pre-release (${nextPrePatch})`,
      value: nextPrePatch,
    },
    {
      label: `minor pre-release (${nextPreMinor})`,
      value: nextPreMinor,
    },
    {
      label: `major pre-release (${nextPreMajor})`,
      value: nextPreMajor,
    },
  ]
  const selectedValue = await select({
    message: `Pick a project version. (current: ${projectVersion})`,
    options: versions,
    initialValue:
      versions[1].value ?? C_CUSTOM,
  })

  if (!selectedValue || selectedValue === C_CUSTOM) {
    return await text({
      message: "Input your custom version number",
      placeholder: "version number",
      validate: (value) => {
        if (!isVersionValid(value)) {
          return "Invalid"
        }
      },
    })
  } else {
    return selectedValue
  }
}

export async function confirmReleaseOptions(args: CommandArgs) {
  async function confirmAndUpdateOption(property: keyof CommandArgs, message: string) {
    if (args && property in args) {
      const confirmation = await confirm({ message })
      if (!isCancel(confirmation) && typeof args[property] === "boolean") {
        // @ts-expect-error implicitly any
        args[property] = confirmation
      } else {
        handleUserCancel()
      }
    }
  }

  await confirmAndUpdateOption("shouldTag", "should create a tag for this release?")
  await confirmAndUpdateOption("shouldCommit", "should commit this release?")
  await confirmAndUpdateOption("shouldPush", "should push to remote repository?")
}


export function handleUserCancel() {
  cancel("User cancel")
  process.exit(ExitCode.InvalidArgument)
}