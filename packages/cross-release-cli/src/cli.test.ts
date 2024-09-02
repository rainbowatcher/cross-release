import { describe, expect, it } from "vitest"
import { createCliProgram, toCliReleaseOptions } from "./cli"
import { CONFIG_DEFAULT } from "./constants"


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
        const cli = createCliProgram().parse(["", "", "-x", "echo hello"])
        const ro = toCliReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello"])
    })

    it("multi execute", () => {
        const cli = createCliProgram().parse(["", "", "-x", "echo hello", "echo bye"])
        const ro = toCliReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello", "echo bye"])
    })

    it("multi execute with multi option", () => {
        const cli = createCliProgram().parse(["", "", "-x", "echo hello", "-x", "echo bye"])
        const ro = toCliReleaseOptions(cli)
        expect(ro.execute).toStrictEqual(["echo hello", "echo bye"])
    })

    it("config", () => {
        const config = "fixture/package.json"
        const cli = createCliProgram().parse(["", "", "-c", config])
        const ro = toCliReleaseOptions(cli)
        expect(ro.config).toBe(config)
    })

    it("cwd", () => {
        const cli = createCliProgram().parse(["", "", "--cwd", "fixture"])
        const ro = toCliReleaseOptions(cli)
        expect(ro.cwd).toBe("fixture")
    })

    it("cwd and config", () => {
        const config = "fixture/package.json"
        const cli = createCliProgram().parse(["", "", "-c", config, "--cwd", "fixture"])
        const ro = toCliReleaseOptions(cli)
        expect(ro.config).toBe(config)
    })
})
