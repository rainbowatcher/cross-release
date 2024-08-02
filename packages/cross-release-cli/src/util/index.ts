export type ResolvedOptions<T> = T extends boolean
    ? never
    : T

export function resolveAltOptions<T extends {}, K extends keyof T>(
    opts: T,
    key: K,
): ResolvedOptions<T[K]> {
    // eslint-disable-next-line ts/no-unsafe-return
    return typeof opts[key] === "boolean"
        ? {} as any
        : opts[key]
}
