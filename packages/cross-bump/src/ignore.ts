import fg from "fast-glob"
// @ts-expect-error missing types
import gitignore from "parse-gitignore"

export const IGNORE_DEFAULT = ["**/node_modules/**", "**/.git/**"]
export const G_GITIGNORE = "**/.gitignore"

export async function getGitignores(cwd: string): Promise<Set<string>> {
    const gitignores = await fg.async(G_GITIGNORE, { absolute: true, cwd })
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
