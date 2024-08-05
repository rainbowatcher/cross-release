import type { ReleaseOptions } from "../types"

export type ResolvedOptions<T> = T extends boolean
    ? never
    : NonNullable<T>

export function resolveAltOptions<K extends keyof ReleaseOptions>(
    opts: ReleaseOptions,
    key: K,
    defaultValue?: ReleaseOptions[K],
): ResolvedOptions<ReleaseOptions[K]> {
    const value = opts[key]
    const _defaultValue = defaultValue ?? {}
    // eslint-disable-next-line ts/no-unsafe-return
    return typeof value === "boolean"
        ? (value ? _defaultValue : {})
        : { ..._defaultValue, ...value as any }
}
