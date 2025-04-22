import { isFileSync } from "@rainbowatcher/fs-extra"
import { toAbsolute } from "@rainbowatcher/path-extra"
import { getGitignores } from "cross-bump"
import { loadConfig } from "unconfig"
import {
    afterEach,
    beforeEach,
    describe, expect, it, vi,
} from "vitest"
import { argvToReleaseOptions, createCliProgram, resolveAppOptions } from "./cli"
import { CONFIG_DEFAULT } from "./constants"


function parseArg(...args: string[]) {
    return createCliProgram(["", "", ...args])
}


describe("toReleaseOptions", () => {
    it("execute", () => {
        const cli = parseArg("-x", "echo hello")
        const ro = argvToReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello"])
    })

    it("multi execute", () => {
        const cli = parseArg("-x", "echo hello", "-x", "echo bye")
        const ro = argvToReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello", "echo bye"])
    })

    it("multi execute with multi option", () => {
        const cli = parseArg("-x", "echo hello", "-x", "echo bye")
        const ro = argvToReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello", "echo bye"])
    })

    it("config", () => {
        const config = "fixture/package.json"
        const cli = parseArg("-c", config)
        const ro = argvToReleaseOptions(cli)
        expect(ro.config).toBe(config)
    })

    it("cwd", () => {
        const cli = parseArg("--cwd", "fixture")
        const ro = argvToReleaseOptions(cli)
        expect(ro.cwd).toBe("fixture")
    })

    it("cwd and config", () => {
        const config = "fixture/package.json"
        const cli = parseArg("-c", config, "--cwd", "fixture")
        const ro = argvToReleaseOptions(cli)
        expect(ro.config).toBe(config)
    })

    it("yes and push", () => {
        const cli = parseArg("-y", "--no-push")
        const ro = argvToReleaseOptions(cli)
        expect(ro.push).toBeFalsy()
        expect(ro.yes).toBeTruthy()
    })

    it("yes", () => {
        const cli = parseArg("-y")
        const ro = argvToReleaseOptions(cli)
        expect(ro.yes).toBeTruthy()
    })
})


describe("resolveAppOptions", () => {
    vi.mock("cross-bump")
    vi.mock("unconfig")
    vi.mock("@rainbowatcher/fs-extra")

    beforeEach(() => {
        vi.mocked(getGitignores).mockReturnValue(new Set())
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it("should props equal to config default when pass nothing", () => {
        const cli = parseArg()
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            version: undefined,
        })
    })

    it("should props equal to config default when pass yes", () => {
        const cli = parseArg("-y")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            version: undefined,
            yes: true,
        })
    })

    it("should props equal to config default when pass --push", () => {
        const cli = parseArg("--push")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            version: undefined,
        })
    })

    it("should props equal to config default when pass --no-push", () => {
        const cli = parseArg("--no-push")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            push: false,
            version: undefined,
        })
    })

    it("should props equal to config default when pass --no-tag", () => {
        const cli = parseArg("--no-tag")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            tag: false,
            version: undefined,
        })
    })

    it("should props equal to config default when pass --no-commit", () => {
        const cli = parseArg("--no-commit")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: false,
            config: undefined,
            version: undefined,
        })
    })

    it("should works when pass --no-push --no-tag --no-commit", () => {
        const cli = parseArg("--no-push", "--no-tag", "--no-commit")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: false,
            config: undefined,
            push: false,
            tag: false,
            version: undefined,
        })
    })

    it("should works when passing --main javascript", () => {
        const cli = parseArg("--main", "javascript")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            version: undefined,
        })
    })

    it("should works when passing --main rust", () => {
        const cli = parseArg("--main", "rust")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            main: "rust",
            version: undefined,
        })
    })

    it("should works when passing --main java", () => {
        const cli = parseArg("--main", "java")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            main: "java",
            version: undefined,
        })
    })

    it("should works when passing -r", () => {
        const cli = parseArg("-r")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            recursive: true,
            version: undefined,
        })
    })

    it("should works when passing --config", () => {
        const mockConfig = {
            config: { main: "java" },
            sources: ["cross-release.config.ts"],
        }
        vi.mocked(loadConfig.sync).mockReturnValue(mockConfig)
        vi.mocked(isFileSync).mockReturnValue(true)

        const cli = parseArg("--config", "cross-release.config.ts")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: toAbsolute("cross-release.config.ts"),
            main: "java",
            version: undefined,
        })
    })

    it("should work when passing --commit.signoff", () => {
        const cli = parseArg("--commit.signoff")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: {
                signoff: true,
                stageAll: false,
                template: "chore: release v%s",
                verify: true,
            },
            config: undefined,
            version: undefined,
        })
    })

    it("should work when passing --no-commit.signoff", () => {
        const cli = parseArg("--no-commit.signoff")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: {
                signoff: false,
                stageAll: false,
                template: "chore: release v%s",
                verify: true,
            },
            config: undefined,
            version: undefined,
        })
    })

    it("should work when passing --commit.stageAll", () => {
        const cli = parseArg("--commit.stageAll")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: {
                signoff: true,
                stageAll: true,
                template: "chore: release v%s",
                verify: true,
            },
            config: undefined,
            version: undefined,
        })
    })

    it("should work when passing --push.followTags", () => {
        const cli = parseArg("--push.followTags")
        const opts = resolveAppOptions(cli)
        expect(opts).toStrictEqual({
            ...CONFIG_DEFAULT,
            config: undefined,
            push: {
                ...CONFIG_DEFAULT.push,
                followTags: true,
            },
            version: undefined,
        })
    })

    it("should throw when passing --push.followTags and --push.followTags", () => {
        const cli = parseArg("--push.followTags", "--push.followTags")
        expect(() => resolveAppOptions(cli)).toThrowErrorMatchingInlineSnapshot(`[Error: process.exit unexpectedly called with "1"]`)
    })
})
