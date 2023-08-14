import semver from "semver"
import { getNextVersions } from "cross-bump"
import { select, text } from "@clack/prompts"

/**
 * Generates the version to be chosen based on command line arguments and project version.
 *
 * @param argv - The command line arguments.
 * @param projectVersion - The project version.
 * @return The chosen version.
 */
export async function chooseVersion(argv: Record<string, unknown>, projectVersion?: string) {
  const versionObj = semver.parse(projectVersion)
  const {
    nextMajor,
    nextMinor,
    nextPatch,
    nextRelease,
    nextPreMajor,
    nextPreMinor,
    nextPrePatch,
  } = getNextVersions(versionObj ?? undefined)

  if (argv?.patch) {
    return nextPatch
  } else if (argv?.minor) {
    return nextMinor
  } else if (argv?.major) {
    return nextMajor
  } else if (argv?.["pre-release"]) {
    return nextRelease
  } else if (argv?.["pre-patch"]) {
    return nextPrePatch
  } else if (argv?.["pre-minor"]) {
    return nextPreMinor
  } else if (argv?.["pre-major"]) {
    return nextPreMajor
  }

  const C_CUSTOM = "custom"
  const versions = [
    { label: "custom...", value: C_CUSTOM },
    { label: `patch (${nextPatch})`, value: nextPatch },
    { label: `minor (${nextMinor})`, value: nextMinor },
    { label: `major (${nextMajor})`, value: nextMajor },
    { label: `pre-release (${nextRelease})`, value: nextRelease },
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
    message: "Pick a project version.",
    options: versions,
    initialValue:
      versions[versionObj?.prerelease.length ? 4 : 1].value ?? C_CUSTOM,
  })

  if (!selectedValue || selectedValue === C_CUSTOM) {
    return await text({
      message: "Input your custom version number",
      placeholder: "version number",
      validate: (value) => {
        if (semver.valid(value)) {
          return "Invalid"
        }
      },
    })
  } else {
    return selectedValue
  }
}