import path from "node:path"
import process from "node:process"
import { getGitignores } from "cross-bump"
import { describe, expect, it } from "vitest"
import {
    initCli, loadUserConfig, resolveOptions, toReleaseOptions,
} from "./cmd"
import { CONFIG_DEFAULT } from "./constants"
import type { CAC } from "cac"


describe.concurrent("arg parse", () => {
    it("default cli parse", () => {
        const { args, options } = initCli([])
        expect(args).toEqual([])
        expect(options).toEqual({
            "--": [],
            commit: true,
            cwd: CONFIG_DEFAULT.cwd,
            d: CONFIG_DEFAULT.debug,
            D: CONFIG_DEFAULT.dry,
            debug: CONFIG_DEFAULT.debug,
            dry: CONFIG_DEFAULT.dry,
            execute: CONFIG_DEFAULT.execute,
            m: CONFIG_DEFAULT.main,
            main: CONFIG_DEFAULT.main,
            push: true,
            r: CONFIG_DEFAULT.recursive,
            recursive: CONFIG_DEFAULT.recursive,
            tag: true,
            x: CONFIG_DEFAULT.execute,
            y: CONFIG_DEFAULT.yes,
            yes: CONFIG_DEFAULT.yes,
        })
    })

    it("should parse args", async () => {
        const cli = initCli([])
        const opts = await resolveOptions(cli)
        const userConfig = await loadUserConfig({})
        expect(opts).toEqual({
            ...CONFIG_DEFAULT,
            cwd: process.cwd(),
            excludes: [...await getGitignores(process.cwd()), ...userConfig.excludes],
            version: undefined,

            commit: true,
            push: true,
            tag: true,
        })
    })

    it("execute", async () => {
        const cli = initCli(["", "", "-x", "echo hello"])
        const parsedArgs = await resolveOptions(cli)
        expect(parsedArgs.execute).toEqual(["echo hello"])
    })

    it("config", async () => {
        const config = "fixture/package.json"
        const cli = initCli(["", "", "-c", config])
        const parsedArgs = await resolveOptions(cli)
        expect(parsedArgs.config).toBe(path.join(process.cwd(), config))
    })

    it("cwd", async () => {
        const cli = initCli(["", "", "--cwd", "fixture"])
        const parsedArgs = await resolveOptions(cli)
        expect(parsedArgs.cwd).toBe(path.join(process.cwd(), "fixture"))
    })

    it("cwd and config", async () => {
        const config = "fixture/package.json"
        const cli = initCli(["", "", "-c", config, "--cwd", "fixture"])
        const parsedArgs = await resolveOptions(cli)
        expect(parsedArgs.config).toBe(path.join(process.cwd(), "fixture", config))
    })
})


describe("toReleaseOptions", () => {
    it("returns default values with empty cli options and args", () => {
        const cli = { args: [], options: {} }
        const result = toReleaseOptions(cli as unknown as CAC)
        expect(result).toEqual({
            commit: undefined,
            config: undefined,
            cwd: undefined,
            debug: undefined,
            dry: undefined,
            excludes: undefined,
            execute: undefined,
            main: undefined,
            push: undefined,
            recursive: undefined,
            tag: undefined,
            version: undefined,
            yes: undefined,
        })
    })

    it("returns values with cli options and args", () => {
        const cli = {
            args: ["v1.0.0"],
            options: {
                commit: true,
                config: "path/to/config",
                cwd: "path/to/cwd",
                debug: true,
                dry: true,
                excludes: ["exclude1", "exclude2"],
                execute: "execute1",
                main: "main1",
                push: true,
                recursive: true,
                tag: true,
                yes: true,
            },
        }
        const result = toReleaseOptions(cli as unknown as CAC)
        expect(result).toEqual({
            commit: true,
            config: "path/to/config",
            cwd: "path/to/cwd",
            debug: true,
            dry: true,
            excludes: ["exclude1", "exclude2"],
            execute: "execute1",
            main: "main1",
            push: true,
            recursive: true,
            tag: true,
            version: "v1.0.0",
            yes: true,
        })
    })

    it("returns default values with missing cli options", () => {
        const cli = {
            args: ["v1.0.0"],
            options: {
                commit: true,
            },
        }
        const result = toReleaseOptions(cli as unknown as CAC)
        expect(result).toEqual({
            commit: true,
            config: undefined,
            cwd: undefined,
            debug: undefined,
            dry: undefined,
            excludes: undefined,
            execute: undefined,
            main: undefined,
            push: undefined,
            recursive: undefined,
            tag: undefined,
            version: "v1.0.0",
            yes: undefined,
        })
    })

    it("returns default values with missing cli args", () => {
        const cli = {
            args: [],
            options: {
                commit: true,
                config: "path/to/config",
            },
        }
        const result = toReleaseOptions(cli as unknown as CAC)
        expect(result).toEqual({
            commit: true,
            config: "path/to/config",
            cwd: undefined,
            debug: undefined,
            dry: undefined,
            excludes: undefined,
            execute: undefined,
            main: undefined,
            push: undefined,
            recursive: undefined,
            tag: undefined,
            version: undefined,
            yes: undefined,
        })
    })
})
