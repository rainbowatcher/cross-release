import { describe, expect, it } from "vitest"
import { createCliProgram, toCliReleaseOptions } from "./cli"
import { CONFIG_DEFAULT } from "./constants"

function run(...args: string[]) {
    return createCliProgram().parse(["", "", ...args])
}

describe.concurrent("arg parse", () => {
    it("default cli parse", () => {
        const cli = createCliProgram()
        expect(cli.args).toStrictEqual([])
        expect(cli.opts()).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: true,
            push: true,
            tag: true,
        })
    })

    it("should parse args", () => {
        const cli = createCliProgram().parse([])
        expect(cli.opts()).toStrictEqual({
            ...CONFIG_DEFAULT,
            commit: true,
            push: true,
            tag: true,
        })
    })
})


describe.concurrent("toReleaseOptions", () => {
    it("execute", () => {
        const cli = run("-x", "echo hello")
        const ro = toCliReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello"])
    })

    it("multi execute", () => {
        const cli = run("-x", "echo hello", "echo bye")
        const ro = toCliReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello", "echo bye"])
    })

    it("multi execute with multi option", () => {
        const cli = run("-x", "echo hello", "-x", "echo bye")
        const ro = toCliReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello", "echo bye"])
    })

    it("config", () => {
        const config = "fixture/package.json"
        const cli = run("-c", config)
        const ro = toCliReleaseOptions(cli)
        expect(ro.config).toBe(config)
    })

    it("cwd", () => {
        const cli = run("--cwd", "fixture")
        const ro = toCliReleaseOptions(cli)
        expect(ro.cwd).toBe("fixture")
    })

    it("cwd and config", () => {
        const config = "fixture/package.json"
        const cli = run("-c", config, "--cwd", "fixture")
        const ro = toCliReleaseOptions(cli)
        expect(ro.config).toBe(config)
    })

    it("yes and push", () => {
        const cli = run("-y", "--no-push")
        const ro = toCliReleaseOptions(cli)
        expect(ro.push).toBeFalsy()
        expect(ro.yes).toBeTruthy()
    })

    it("yes", () => {
        const cli = run("-y")
        const ro = toCliReleaseOptions(cli)
        expect(ro.yes).toBeTruthy()
        expect(ro.push).toBeTruthy()
    })
})
