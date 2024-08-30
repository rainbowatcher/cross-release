import * as semver from "semver"
import {
    afterAll, describe, expect, it,
} from "vitest"
import { findProjectFiles } from "./project"
import {
    getJavaProjectVersion,
    getJSProjectVersion,
    getNextVersions,
    getRustProjectVersion,
    isVersionValid,
    upgradeCargoVersion,
    upgradePackageVersion,
    upgradePomVersion,
    upgradeProjectVersion,
} from "./version"

const defaultVersion = "1.1.1"

describe("version", () => {
    afterAll(async () => {
        const projectFiles = findProjectFiles("fixture", ["ignored"], true)
        await Promise.all(projectFiles.map(file => upgradeProjectVersion(defaultVersion, file)))
    })

    describe("javascript project", () => {
        const projectFiles = findProjectFiles("fixture")
        const projectFile = projectFiles.find(p => p.category === "javascript")

        it("should return the project version", () => {
            const version = getJSProjectVersion(projectFile!.path)
            expect(semver.valid(version)).toBe(defaultVersion)
        })

        it("should upgrade Javascript project version", () => {
            upgradePackageVersion(projectFile!.path, "1.2.3")
            const version = getJSProjectVersion(projectFile!.path)
            expect(semver.valid(version)).toBe("1.2.3")
        })
    })


    describe("java project", () => {
        const projectFiles = findProjectFiles("fixture/java")
        const projectFile = projectFiles.find(p => p.category === "java")

        it("should return the project version", () => {
            const version = getJavaProjectVersion(projectFile!.path)
            expect(semver.valid(version)).toBe(defaultVersion)
        })

        it("should upgrade Java project version", () => {
            upgradePomVersion(projectFile!.path, "1.2.3")
            const version = getJavaProjectVersion(projectFile!.path)
            expect(semver.valid(version)).toBe("1.2.3")
        })
    })


    describe("rust project", () => {
        const projectFiles = findProjectFiles("fixture/rust-mod1")
        const projectFile = projectFiles.find(p => p.category === "rust")

        it("should return the project version", async () => {
            const version = await getRustProjectVersion(projectFile!.path)
            expect(version).toBe(defaultVersion)
        })

        it("should upgrade Rust project version", async () => {
            await upgradeCargoVersion(projectFile!.path, "1.2.3")
            const version = await getRustProjectVersion(projectFile!.path)
            expect(version).toBe("1.2.3")
        })
    })

    describe("getNextVersions", () => {
        it("should generate next versions from a given version", () => {
            const version = "1.2.3"
            const expected = {
                nextMajor: "2.0.0",
                nextMinor: "1.3.0",
                nextPatch: "1.2.4",
                nextPreMajor: "2.0.0-alpha.1",
                nextPreMinor: "1.3.0-alpha.1",
                nextPrePatch: "1.2.4-alpha.1",
                nextRelease: "1.2.4",
            }

            expect(getNextVersions(version)).toStrictEqual(expected)
        })

        it("should generate next versions from a given semver object", () => {
            const version = new semver.SemVer("1.2.3")
            const expected = {
                nextMajor: "2.0.0",
                nextMinor: "1.3.0",
                nextPatch: "1.2.4",
                nextPreMajor: "2.0.0-alpha.1",
                nextPreMinor: "1.3.0-alpha.1",
                nextPrePatch: "1.2.4-alpha.1",
                nextRelease: "1.2.4",
            }

            expect(getNextVersions(version)).toStrictEqual(expected)
        })

        it("should generate next versions from a given semver object with prerelease", () => {
            const version = new semver.SemVer("1.2.3-beta.1")
            const expected = {
                nextMajor: "2.0.0",
                nextMinor: "1.3.0",
                nextPatch: "1.2.3",
                nextPreMajor: "2.0.0-alpha.1",
                nextPreMinor: "1.3.0-alpha.1",
                nextPrePatch: "1.2.4-alpha.1",
                nextRelease: "1.2.3-beta.2",
            }

            expect(getNextVersions(version)).toStrictEqual(expected)
        })

        it("should generate next versions from a coerced version", () => {
            const version = "1.2"
            const expected = {
                nextMajor: "2.0.0",
                nextMinor: "1.3.0",
                nextPatch: "1.2.1",
                nextPreMajor: "2.0.0-alpha.1",
                nextPreMinor: "1.3.0-alpha.1",
                nextPrePatch: "1.2.1-alpha.1",
                nextRelease: "1.2.1",
            }

            expect(getNextVersions(version, true)).toStrictEqual(expected)
        })

        it("should return default next versions for undefined version", () => {
            const expected = {
                nextMajor: "1.0.0",
                nextMinor: "0.1.0",
                nextPatch: "0.0.1",
                nextPreMajor: "1.0.0-alpha.1",
                nextPreMinor: "0.1.0-alpha.1",
                nextPrePatch: "0.0.1-alpha.1",
                nextRelease: "0.0.1-alpha.1",
            }

            expect(getNextVersions()).toStrictEqual(expected)
        })
    })

    describe("isValidVersion", () => {
        it("should return true for a valid version", () => {
            expect(isVersionValid("1.2.3")).toBeTruthy()
            expect(isVersionValid("1.2.3-alpha-1")).toBeTruthy()
            expect(isVersionValid("1.2.3-alpha")).toBeTruthy()
            expect(isVersionValid("1.2.3-alpha.1")).toBeTruthy()
            expect(isVersionValid("1.2.3-any.1")).toBeTruthy()
            expect(isVersionValid("1.2.3-any-1")).toBeTruthy()
            expect(isVersionValid("1.2.3-ANY-1")).toBeTruthy()
            expect(isVersionValid("1.2.3-ANY.1")).toBeTruthy()
        })

        it("should return false for an invalid version", () => {
            expect(isVersionValid("1.2.3_alpha.1")).toBeFalsy()
            expect(isVersionValid("1.2.3.alpha.1")).toBeFalsy()
            expect(isVersionValid("1.2.alpha.1")).toBeFalsy()
            expect(isVersionValid("1.2.3.4-alpha.1")).toBeFalsy()
            expect(isVersionValid("1.2")).toBeFalsy()
            expect(isVersionValid("invalid")).toBeFalsy()
        })

        it("should return false for an empty string", () => {
            expect(isVersionValid("")).toBeFalsy()
        })

        it("should return false for a null value", () => {
        // @ts-expect-error param type incompatible
            expect(isVersionValid(null)).toBeFalsy()
        })

        it("should return false for undefined", () => {
            expect(isVersionValid()).toBeFalsy()
        })
    })
})
