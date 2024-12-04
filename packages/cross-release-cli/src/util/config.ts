import process from "node:process"
import { isFileSync } from "@rainbowatcher/fs-extra"
import { toAbsolute } from "@rainbowatcher/path-extra"
import defu from "defu"
import { loadConfig } from "unconfig"
import createDebug from "../util/debug"
import type { Arrayable, ReleaseOptions, ResolvedOptions } from "../types"

const debug = createDebug("config")


export function resolveAltOptions<K extends keyof ReleaseOptions>(
    opts: ReleaseOptions,
    key: K,
    defaultValue?: ReleaseOptions[K],
): ResolvedOptions<ReleaseOptions[K]> {
    const value = opts[key]
    const _defaultValue = defaultValue ?? {}
    return typeof value === "boolean"
        ? (value ? _defaultValue : {})
        : { ..._defaultValue, ...value as any }
}

export function resolveArrayable<T = any>(maybeArr: Arrayable<T>): T[] {
    if (!maybeArr) return []
    return Array.isArray(maybeArr) ? maybeArr : [maybeArr]
}

export async function loadUserSpecifiedConfigFile(configPath: string, currentOpts: Partial<ReleaseOptions>): Promise<Partial<ReleaseOptions>> {
    const absConfigPath = toAbsolute(configPath)
    if (!isFileSync(absConfigPath)) {
        throw new Error(`${absConfigPath} is not a valid file.`)
    }

    const { config, sources } = await loadConfig<Partial<ReleaseOptions>>({
        sources: [{
            files: absConfigPath,
        }],
    })

    debug("load specified config file:", sources)
    return defu({ config: toAbsolute(currentOpts.config ?? "") }, currentOpts, config)
}

export async function loadUserConfig(cwd = process.cwd()): Promise<Partial<ReleaseOptions>> {
    const { config: userConfig, sources } = await loadConfig<Partial<ReleaseOptions>>({
        cwd,
        sources: [
            { files: "cross-release.config" },
            {
                extensions: ["json"],
                files: "package",
                rewrite(config: any) {
                    return config["cross-release"]
                },
            },
        ],
    })

    debug("load user config", sources)
    debug("user config:", userConfig)
    return userConfig
}
