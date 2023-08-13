import { beforeAll, describe, expect, it } from "vitest"
import * as semver from "semver"
import {
  getJSProjectVersion,
  getJavaProjectVersion,
  getNextVersions,
  getRustProjectVersion,
  upgradeCargoVersion,
  upgradePackageVersion,
  upgradePomVersion,
} from "./version"
import { findProjectFiles } from "./project"

beforeAll(async () => {
  const defaultVersion = "1.1.1"
  const projectFiles = await findProjectFiles("fixture")
  for await (const file of projectFiles) {
    if (file.category === "rust") {
      await upgradeCargoVersion(file.path, defaultVersion)
    } else if (file.category === "javascript") {
      await upgradePackageVersion(file.path, defaultVersion)
    } else if (file.category === "java") {
      await upgradePomVersion(file.path, defaultVersion)
    }
  }
})


describe("Javascript project version related operation", async () => {
  const projectFiles = await findProjectFiles("fixture")
  const projectFile = projectFiles.findLast(p => p.category === "javascript")

  it("should return the project version", async () => {
    const version = await getJSProjectVersion(projectFile!.path)
    expect(semver.valid(version)).toMatchInlineSnapshot('"1.1.1"')
  })

  it("should upgrade Javascript project version", async () => {
    await upgradePackageVersion(projectFile!.path, "1.2.3")
    const version = await getJSProjectVersion(projectFile!.path)
    expect(semver.valid(version)).toMatchInlineSnapshot('"1.2.3"')
  })
})


describe("Java project version related operation", async () => {
  const projectFiles = await findProjectFiles("fixture")
  const projectFile = projectFiles.find(p => p.category === "java")

  it("should return the project version", async () => {
    const version = await getJavaProjectVersion(projectFile!.path)
    expect(semver.valid(version)).toMatchInlineSnapshot('"1.1.1"')
  })

  it("should upgrade Java project version", async () => {
    await upgradePomVersion(projectFile!.path, "1.2.3")
    const version = await getJavaProjectVersion(projectFile!.path)
    expect(semver.valid(version)).toMatchInlineSnapshot('"1.2.3"')
  })
})

describe("Rust project version related operation", async () => {
  const projectFiles = await findProjectFiles("fixture/rust")
  const projectFile = projectFiles.find(p => p.category === "rust")

  it("should return the project version", async () => {
    const version = await getRustProjectVersion(projectFile!.path)
    expect(version).toMatchInlineSnapshot('"1.1.1"')
  })

  it("should upgrade Rust project version", async () => {
    await upgradeCargoVersion(projectFile!.path, "1.2.3")
    const version = await getRustProjectVersion(projectFile!.path)
    expect(version).toMatchInlineSnapshot('"1.2.3"')
  })
})

describe("getNextVersions", () => {
  it("should generate next versions from a given version", () => {
    const version = "1.2.3"
    const expected = {
      nextMajor: "2.0.0",
      nextMinor: "1.3.0",
      nextPatch: "1.2.4",
      nextRelease: "1.2.3-alpha.1",
      nextPreMajor: "2.0.0-alpha.1",
      nextPreMinor: "1.3.0-alpha.1",
      nextPrePatch: "1.2.4-alpha.1",
    }

    expect(getNextVersions(version)).toEqual(expected)
  })

  it("should generate next versions from a given semver object", () => {
    const version = new semver.SemVer("1.2.3")
    const expected = {
      nextMajor: "2.0.0",
      nextMinor: "1.3.0",
      nextPatch: "1.2.4",
      nextRelease: "1.2.3-alpha.1",
      nextPreMajor: "2.0.0-alpha.1",
      nextPreMinor: "1.3.0-alpha.1",
      nextPrePatch: "1.2.4-alpha.1",
    }

    expect(getNextVersions(version)).toEqual(expected)
  })

  it("should generate next versions from a coerced version", () => {
    const version = "1.2"
    const expected = {
      nextMajor: "2.0.0",
      nextMinor: "1.3.0",
      nextPatch: "1.2.0",
      nextRelease: "1.2.0-alpha.1",
      nextPreMajor: "2.0.0-alpha.1",
      nextPreMinor: "1.3.0-alpha.1",
      nextPrePatch: "1.2.0-alpha.1",
    }

    expect(getNextVersions(version, true)).toEqual(expected)
  })

  it("should return default next versions for undefined version", () => {
    const expected = {
      nextMajor: "1.0.0",
      nextMinor: "0.1.0",
      nextPatch: "0.0.1",
      nextRelease: "0.0.0-alpha.1",
      nextPreMajor: "1.0.0-alpha.1",
      nextPreMinor: "0.1.0-alpha.1",
      nextPrePatch: "0.0.1-alpha.1",
    }

    expect(getNextVersions()).toEqual(expected)
  })
})