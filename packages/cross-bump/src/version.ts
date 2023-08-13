import * as fs from "node:fs/promises"
import * as path from "node:path"
import type { PathLike } from "node:fs"
import * as cheerio from "cheerio"
import { blue } from "colorette"
import semver from "semver"
import detectIndent from "detect-indent"
import * as TOML from "@iarna/toml"
import { isJsonMap } from "./util"



/**
 * Generates the next versions based on the given version.
 *
 * @param version - Optional. The version to generate the next versions from.
 * @param coerce - Optional. Whether to coerce the version or not. Defaults to false.
 * @return An object containing the next major, minor, patch, release, pre-major, pre-minor, and pre-patch versions.
 */
export function getNextVersions(version?: string | semver.SemVer, coerce = false) {
  let versionNum: string | semver.SemVer
  let id: string

  const defaultId = "alpha"
  if (version instanceof semver.SemVer) {
    versionNum = version.version
    id = `${version.prerelease[0]}`
  } else if (typeof version === "string") {
    versionNum = coerce ? semver.coerce(version)?.version ?? version : version
    id = `${semver.prerelease(version)?.[0] ?? defaultId}`
  } else {
    versionNum = "0.0.0"
    id = defaultId
  }

  const nextMajor = semver.inc(versionNum, "major") || "undefined"
  const nextMinor = semver.inc(versionNum, "minor") || "undefined"
  const nextPatch = semver.inc(versionNum, "patch") || "undefined"
  const nextRelease = semver.inc(versionNum, "prerelease", id, "1") || "undefined"
  const nextPreMajor = semver.inc(versionNum, "premajor", defaultId, "1") || "undefined"
  const nextPreMinor = semver.inc(versionNum, "preminor", defaultId, "1") || "undefined"
  const nextPrePatch = semver.inc(versionNum, "prepatch", defaultId, "1") || "undefined"
  return {
    nextMajor,
    nextMinor,
    nextPatch,
    nextRelease,
    nextPreMajor,
    nextPreMinor,
    nextPrePatch,
  }
}

/**
 * Upgrades the version of the POM file.
 *
 * @param filePath - The path to the POM file.
 * @param version - The new version to set.
 * @param [dry=false] - Whether to perform a dry run or not.
 * @return A promise that resolves when the version upgrade is complete.
 */
export async function upgradePomVersion(filePath: PathLike, version: string, dry = false) {
  const content = await fs.readFile(filePath, "utf-8")
  const $ = cheerio.load(content, {
    xml: { decodeEntities: false },
  })
  const projectVersion = $("project>version")
  const parentVersion = $("project>parent>version")
  projectVersion?.text(version)
  parentVersion?.text(version)
  printVersion(version, filePath)
  if (!dry) {
    await fs.writeFile(filePath, $.xml())
  }
}

/**
 * Retrieves the version of the Java project.
 *
 * @return The version of the Java project.
 */
export async function getJavaProjectVersion(filePath: PathLike) {
  const pom = await fs.readFile(filePath, "utf-8")
  const $ = cheerio.load(pom)
  const currVersion = $("project>version").text()
  return currVersion
}

export async function upgradePackageVersion(filePath: PathLike, version: string, dry = false) {
  const file = await fs.readFile(filePath, "utf-8")
  const { amount } = detectIndent(file)
  const packageJson = JSON.parse(file)
  printVersion(version, filePath)
  if (!dry) {
    packageJson.version = version
    await fs.writeFile(filePath, JSON.stringify(packageJson, null, amount ?? 2))
  }
}

function printVersion(version: string, filePath: PathLike) {
  console.log(
    `| upgrade version to ${blue(version)} for ${path.relative(
      process.cwd(),
      filePath.toString(),
    )}`,
  )
}

export async function getJSProjectVersion(filePath: PathLike) {
  const packageJson = await fs.readFile(filePath, "utf-8")
  const { version } = JSON.parse(packageJson)
  return version
}

export async function getRustProjectVersion(filePath: PathLike) {
  const file = await fs.readFile(filePath, "utf-8")
  const { package: cargoPackage } = TOML.parse(file)
  if (isJsonMap(cargoPackage)) {
    if (cargoPackage.version) {
      return cargoPackage.version
    }
  }
}

export async function upgradeCargoVersion(filePath: PathLike, version: string, dry = false) {
  const file = await fs.readFile(filePath, "utf-8")
  // const { amount } = detectIndent(file)
  const cargoToml = TOML.parse(file)
  printVersion(version, filePath)
  if (!dry) {
    if (isJsonMap(cargoToml.package)) {
      if (cargoToml.package.version) {
        cargoToml.package.version = version
      }
    }
    await fs.writeFile(filePath, TOML.stringify(cargoToml))
  }
}
