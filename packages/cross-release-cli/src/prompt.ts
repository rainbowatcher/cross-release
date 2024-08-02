import { select, text } from "@clack/prompts"
import { getNextVersions, isVersionValid, parseVersion } from "cross-bump"

/**
 * Generates the version to be chosen based on command line arguments and project version.
 *
 * @param argv - The command line arguments.
 * @param currentVersion - The current project version.
 * @return The chosen version.
 */
export async function chooseVersion(currentVersion?: string): Promise<string | symbol> {
    const versionObj = parseVersion(currentVersion)
    const {
        nextMajor,
        nextMinor,
        nextPatch,
        nextPreMajor,
        nextPreMinor,
        nextPrePatch,
        nextRelease,
    } = getNextVersions(versionObj ?? undefined)

    const C_CUSTOM = "custom"
    const versions = [
        { label: "custom...", value: C_CUSTOM },
        { label: `next (${nextRelease})`, value: nextRelease },
        { label: `keep (${currentVersion})`, value: currentVersion ?? "" },
        { label: `patch (${nextPatch})`, value: nextPatch },
        { label: `minor (${nextMinor})`, value: nextMinor },
        { label: `major (${nextMajor})`, value: nextMajor },
        { label: `pre-patch (${nextPrePatch})`, value: nextPrePatch },
        { label: `pre-minor (${nextPreMinor})`, value: nextPreMinor },
        { label: `pre-major (${nextPreMajor})`, value: nextPreMajor },
    ]
    const selectedValue = await select({
        initialValue:
      versions[1].value ?? C_CUSTOM,
        message: `Pick a project version. (current: ${currentVersion})`,
        options: versions,
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
