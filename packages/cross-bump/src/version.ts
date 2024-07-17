import * as fs from "node:fs/promises"
import process from "node:process"
import * as TOML from "@iarna/toml"
import * as cheerio from "cheerio"
import detectIndent from "detect-indent"
import semver from "semver"
import { isJsonMap } from "./util"
import type { ProjectFile } from "./project"
import type { PathLike } from "node:fs"

const FALLBACK_VERSION = "undefined"
type VersionNumbers = {
    nextMajor: string
    nextMinor: string
    nextPatch: string
    nextPreMajor: string
    nextPreMinor: string
    nextPrePatch: string
    nextRelease: string
}

/**
 * Generates the next versions based on the given version.
 *
 * @param version - Optional. The version to generate the next versions from.
 * @param coerce - Optional. Whether to coerce the version or not. Defaults to false.
 * @return An object containing the next major, minor, patch, release, pre-major, pre-minor, and pre-patch versions.
 */
export function getNextVersions(version?: semver.SemVer | string, coerce = false): VersionNumbers {
    let versionNum: semver.SemVer | string
    let id: string | undefined

    const defaultId = "alpha"
    if (version instanceof semver.SemVer) {
        versionNum = version.version
        id = `${version.prerelease[0] ?? ""}`
    } else if (typeof version === "string") {
        versionNum = coerce ? semver.coerce(version)?.version ?? version : version
        id = `${semver.prerelease(version)?.[0] ?? ""}`
    } else {
        versionNum = "0.0.0"
        id = defaultId
    }

    const nextMajor = semver.inc(versionNum, "major") ?? FALLBACK_VERSION
    const nextMinor = semver.inc(versionNum, "minor") ?? FALLBACK_VERSION
    const nextPatch = semver.inc(versionNum, "patch") ?? FALLBACK_VERSION
    const nextRelease = (id ? semver.inc(versionNum, "prerelease", id, "1") : semver.inc(versionNum, "patch")) ?? FALLBACK_VERSION
    const nextPreMajor = semver.inc(versionNum, "premajor", defaultId, "1") ?? FALLBACK_VERSION
    const nextPreMinor = semver.inc(versionNum, "preminor", defaultId, "1") ?? FALLBACK_VERSION
    const nextPrePatch = semver.inc(versionNum, "prepatch", defaultId, "1") ?? FALLBACK_VERSION
    return {
        nextMajor,
        nextMinor,
        nextPatch,
        nextPreMajor,
        nextPreMinor,
        nextPrePatch,
        nextRelease,
    }
}

/**
 * Upgrades the version of the POM file.
 *
 * @param filePath - The path to the POM file.
 * @param version - The new version to set.
 * @param dry - Whether to perform a dry run or not. @default process.env.DRY
 * @return A promise that resolves when the version upgrade is complete.
 */
export async function upgradePomVersion(filePath: PathLike, version: string, dry = process.env.DRY): Promise<void> {
    const content = await fs.readFile(filePath, "utf8")
    const $ = cheerio.load(content, {
        xml: { decodeEntities: false },
    })
    const projectVersion = $("project>version")
    const parentVersion = $("project>parent>version")
    projectVersion?.text(version)
    parentVersion?.text(version)
    if (!dry) {
        await fs.writeFile(filePath, $.xml())
    }
}

/**
 * Retrieves the version of the Java project.
 *
 * @return The version of the Java project.
 */
export async function getJavaProjectVersion(filePath: PathLike): Promise<string | undefined> {
    const pom = await fs.readFile(filePath, "utf8")
    const $ = cheerio.load(pom)
    const currVersion = $("project>version").text()
    return currVersion
}

/**
 * Updates the version of a package in a specified file.
 *
 * @param filePath - The path to the file.
 * @param version - The new version to set.
 * @param dry - Whether to perform a dry run. @default process.env.DRY
 * @return A promise that resolves when the version is upgraded.
 */
export async function upgradePackageVersion(filePath: PathLike, version: string, dry = process.env.DRY): Promise<void> {
    const file = await fs.readFile(filePath, "utf8")
    const { amount } = detectIndent(file)
    const packageJson = JSON.parse(file)
    if (!dry) {
        packageJson.version = version
        await fs.writeFile(filePath, JSON.stringify(packageJson, null, amount ?? 2))
    }
}

/**
 * Reads the package.json file at the specified file path and returns the version number.
 *
 * @param filePath - The path to the package.json file.
 * @return The version number as a string, or undefined if the file cannot be read or parsed.
 */
export async function getJSProjectVersion(filePath: PathLike): Promise<string | undefined> {
    const packageJson = await fs.readFile(filePath, "utf8")
    const { version } = JSON.parse(packageJson)
    return version as string
}

/**
 * Retrieves the version of a Rust project based on the contents of a specified file.
 *
 * @param filePath - The path to the file containing the Rust project details.
 * @return The version of the Rust project, or undefined if the version is not available.
 */
export async function getRustProjectVersion(filePath: PathLike): Promise<string | undefined> {
    const file = await fs.readFile(filePath, "utf8")
    const { package: cargoPackage } = TOML.parse(file)
    if (isJsonMap(cargoPackage) && cargoPackage.version) {
        return cargoPackage.version as string
    }
}

/**
 * Upgrade the cargo version in the specified file.
 *
 * @param filePath - The path to the file.
 * @param version - The version to upgrade to.
 * @param dry - Whether to perform a dry run. @default process.env.DRY
 * @return A promise that resolves when the upgrade is complete.
 */
export async function upgradeCargoVersion(filePath: PathLike, version: string, dry = process.env.DRY): Promise<void> {
    const file = await fs.readFile(filePath, "utf8")
    const cargoToml = TOML.parse(file)
    if (!dry) {
        const { package: cargoPackage, workspace } = cargoToml
        if (isJsonMap(cargoPackage)
            && cargoPackage.version
            && typeof cargoPackage.version === "string") {
            cargoPackage.version = version
        }
        if (isJsonMap(workspace)
            && isJsonMap(workspace.package)
            && workspace.package.version
            && typeof workspace.package.version === "string") {
            workspace.package.version = version
        }
        await fs.writeFile(filePath, TOML.stringify(cargoToml))
    }
}

export async function upgradeProjectVersion(nextVersion: string, projectFile?: ProjectFile, dry = process.env.DRY): Promise<void> {
    switch (projectFile?.category) {
        case "java": {
            await upgradePomVersion(projectFile.path, nextVersion, dry)
            break
        }
        case "javascript": {
            await upgradePackageVersion(projectFile.path, nextVersion, dry)
            break
        }
        case "rust": {
            await upgradeCargoVersion(projectFile.path, nextVersion, dry)
            break
        }
    }
}

export async function getProjectVersion(projectFile: ProjectFile) {
    let projectVersion
    switch (projectFile?.category) {
        case "java": {
            projectVersion = await getJavaProjectVersion(projectFile.path)
            break
        }
        case "javascript": {
            projectVersion = await getJSProjectVersion(projectFile.path)
            break
        }
        case "rust": {
            projectVersion = await getRustProjectVersion(projectFile.path)
        }
    }
    return projectVersion
}

export function isVersionValid(version?: string): boolean {
    return !!semver.valid(version)
}
