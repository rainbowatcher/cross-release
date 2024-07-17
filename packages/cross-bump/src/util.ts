import type * as TOML from "@iarna/toml"
import type { PathLike } from "node:fs"

type JsonMap = TOML.JsonMap

/**
 * Checks if the given object is a JSON map.
 *
 * @param obj - The object to be checked.
 * @return Returns true if the object is a JSON map, false otherwise.
 */
export function isJsonMap(obj: unknown): obj is JsonMap {
    return typeof obj === "object"
        && obj !== null
        && !Array.isArray(obj)
        && !(obj instanceof Date)
}

export function isBlankPath(path?: PathLike): path is "" | undefined {
    return path === undefined || path.toString().trim().length === 0
}
