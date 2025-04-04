import { Objects } from "@rainbowatcher/common"


export function merge<T extends Record<PropertyKey, any>, S extends Record<PropertyKey, any>>(target: T, ...sources: S[]) {
    let result = target as Objects.MergedType<T, S>
    const composer: Objects.Composer = (left, right, key) => {
        if (["commit", "push", "tag"].includes(key as string) && right === true) {
            return left
        }
    }
    for (const source of sources) {
        result = Objects.mergeWith(target, source, composer)
    }
    return result
}
