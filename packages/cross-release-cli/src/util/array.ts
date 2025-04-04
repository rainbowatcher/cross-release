import type { MaybeArray } from "@rainbowatcher/maybe"

export function toArray<T = any>(maybeArr: MaybeArray<T>): T[] {
    if (!maybeArr) return []
    return Array.isArray(maybeArr) ? maybeArr : [maybeArr]
}
