import fg from "fast-glob"
// @ts-expect-error missing types
import gitignore from "parse-gitignore"

export const IGNORE_DEFAULT = ["node_modules", ".git", "target", "build", "dist"]
export const G_GITIGNORE = "**/.gitignore"

export function getGitignores(cwd: string, ignore = IGNORE_DEFAULT): Set<string> {
    const gitignores = fg.sync(G_GITIGNORE, {
        absolute: true,
        cwd,
        ignore,
        onlyFiles: true,
    })
    const set = new Set<string>(IGNORE_DEFAULT)
    for (const gi of gitignores) {
        const result = gitignore(gi)
        if (!result?.globs()?.length) continue
        for (const item of result.globs()[0].patterns) {
            set.add(item)
        }
    }
    return set
}
