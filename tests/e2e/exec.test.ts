import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { execaSync } from "execa"
import git from "isomorphic-git"
import {
    afterEach, beforeAll, beforeEach, describe, expect, it,
} from "vitest"
import { findProjectFiles, getJSProjectVersion, upgradeProjectVersion } from "../../packages/cross-bump/src"

const SCRIPT = "packages/cross-release-cli/src/run.ts"
const fixture = path.join(process.cwd(), "fixture")
const changelog = "changelog.md"
const changelogPath = path.join(fixture, changelog)

function run(...args: string[]) {
    return execaSync({ all: true, reject: false })`tsx ${SCRIPT} ${args}`
}

// https://isomorphic-git.org/docs/en/status

async function restoreFixture() {
    const pFiles = findProjectFiles(fixture, [".git"], true)
    const restore = pFiles.map(async (pFile) => {
        await upgradeProjectVersion("1.1.1", pFile)
    })
    await Promise.all(restore)
    fs.rmSync(changelogPath, { force: true })
    fs.rmSync(path.join(fixture, ".git"), { force: true, recursive: true })
}

describe.skipIf(process.env.CI)("exec", () => {
    beforeAll(async () => {
        await restoreFixture()
    })

    beforeEach(async () => {
        await git.init({ dir: fixture, fs })
        await git.add({ dir: fixture, filepath: ".", fs })
        await git.commit({
            author: { email: "test@example.com", name: "test" }, dir: fixture, fs, message: "init",
        })
        // const { all } = execaSync("git", ["rev-parse", "--show-toplevel"], { all: true, cwd: fixture })
    })

    afterEach(async () => {
        await restoreFixture()
    })

    it("should run", () => {
        const { all } = run("--cwd", "fixture")
        expect(all, all).toContain("Pick a project version")
    })

    it("should run with dry", () => {
        const { all } = run("--cwd", "fixture", "--dry")
        expect(all).toContain("DRY")
    })

    it("should run with version", () => {
        const { all } = run("--cwd", "fixture", "0.1.0", "--dry")
        expect(all).toContain("next version: 0.1.0")
    })

    it("fail when git is not clean", async () => {
        const filepath = "changelog.md"
        const changelogPath = path.join(fixture, filepath)
        fs.writeFileSync(changelogPath, "")
        await git.add({ dir: fixture, filepath, fs })
        const status = await git.status({ dir: fixture, filepath, fs })
        expect(status).toBe("added")

        const { all, failed, message } = run("--cwd", "fixture")
        expect(failed, all).toBeTruthy()

        expect(message).toContain("git is not clean")
    })

    it("should update version and commit", async () => {
        const { all, failed } = run("--cwd", "fixture", "1.1.2", "-y", "--no-tag", "--no-push")
        expect(failed, all).toBeFalsy()
        expect(getJSProjectVersion(path.join(fixture, "package.json"))).toBe("1.1.2")
        const log = await git.log({ dir: fixture, fs })
        expect(log.at(0)?.commit.message.trim()).toMatchInlineSnapshot(`"chore: release v1.1.2"`)
    })

    it("should add changelog if stageAll option is not set", async () => {
        const { all, failed } = run("--cwd", "fixture", "1.1.2", "-dy", "--no-tag", "--no-push", "-x", `touch ${changelogPath}`)
        expect(failed, all).toBeFalsy()
        expect(fs.existsSync(changelogPath)).toBeTruthy()
        const status = await git.status({ dir: fixture, filepath: changelog, fs })
        expect(status, all).toBe("*added")
    })

    it("should not add changelog if stageAll option is set", async () => {
        const { all, failed } = run("--cwd", "fixture", "1.1.2", "-dy", "--no-tag", "--no-push", "--commit.stageAll", "-x", `touch ${changelogPath}`)
        expect(failed, all).toBeFalsy()
        const status = await git.status({ dir: fixture, filepath: changelog, fs })
        expect(fs.existsSync(changelogPath)).toBeTruthy()
        expect(status).toBe("unmodified")
    })

    it("should load config based on user specified cwd option", () => {
        const { all, failed } = run("--cwd", "fixture", "1.1.2", "-dy", "--no-tag", "--no-push")
        expect(failed, all).toBeFalsy()
        expect(all).toContain("fixtureConfigLoaded")
    })

    describe("exclude", () => {
        it("default exclude", () => {
            const { all, failed } = run("--cwd", "fixture", "1.1.2", "-dy", "--no-tag", "--no-push")
            expect(failed, all).toBeFalsy()
            expect(all).toContain("**/node_modules/**")
            expect(all).toContain("**/.git/**")
            expect(all).toContain("**/target/**")
            expect(all).toContain("**/build/**")
            expect(all).toContain("**/dist/**")
        })

        it("should combine cli exclude into default exclude list", () => {
            const { all, failed } = run("--cwd", "fixture", "1.1.2", "-dy", "--no-tag", "--no-push", "-e", "testExclude")
            expect(failed, all).toBeFalsy()
            // TODO: should append exclude, not overwrite
            expect(all).toContain("**/ignored")
            expect(all).toContain("**/ignored/**")
            expect(all).toContain("testExclude")
        })
    })
})
