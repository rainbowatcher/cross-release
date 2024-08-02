import type { PathLike } from "node:fs"

export function isBlankPath(path?: PathLike): path is "" | undefined {
    return path === undefined || path.toString().trim().length === 0
}
