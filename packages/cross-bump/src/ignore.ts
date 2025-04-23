import fg from "fast-glob"
// @ts-expect-error missing types
import gitignore from "parse-gitignore"

export const DEFAULT_IGNORED_GLOBS: string[] = ["**/node_modules/**", "**/.git/**", "**/target/**", "**/build/**", "**/dist/**"]
export const G_GITIGNORE = "**/.gitignore"

export function getGitignores(cwd?: string, ignoreGlobs = DEFAULT_IGNORED_GLOBS): Set<string> {
    const gitignores = fg.sync(G_GITIGNORE, {
        absolute: true,
        cwd,
        ignore: ignoreGlobs,
        onlyFiles: true,
    })
    const set = new Set<string>()
    for (const gi of gitignores) {
        const result = gitignore(gi)
        if (!result?.globs()?.length) continue
        for (const item of result.globs()[0].patterns) {
            set.add(item)
        }
    }
    return set
}
