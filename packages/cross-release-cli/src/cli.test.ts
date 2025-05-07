import { describe, expect, it } from "vitest"
import { argvToReleaseOptions, createCliProgram, resolveAppOptions } from "./cli"


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


describe("exclude", () => {
    it("should include exclude specified in args", () => {
        const cli = parseArg("--exclude", "foo")
        const opts = resolveAppOptions(cli)
        expect(opts.exclude.includes("foo")).toBeTruthy()
    })
})
