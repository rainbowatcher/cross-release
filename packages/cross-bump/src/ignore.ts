/* eslint-disable style-ts/brace-style */
import { readFileSync } from "node:fs"
import fg from "fast-glob"
import isGlob from "is-glob"

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
        const rules = readFileSync(gi, { encoding: "utf8" })
        const globs = parseGitingore(rules)
        if (globs.length === 0) continue
        for (const item of globs) {
            set.add(item)
        }
    }
    return set
}

/**
 * parse gitignore to globs
 * @param content gitignore file content
 */
export function parseGitingore(content: string): string[] {
    const globs: string[] = []
    const lines = content.split(/\r\n?|\n/)

    for (const rawLine of lines) {
        const line = rawLine.trim()

        if (line.startsWith("#") || line.length === 0) {
            continue
        }

        let isNegative = false
        let pattern = line

        if (pattern.startsWith("!")) {
            isNegative = true
            pattern = pattern.slice(1)
        }

        // Handle patterns that are already globs
        if (isGlob(pattern)) {
            globs.push(isNegative ? `!${pattern}` : pattern)
            continue
        }

        // Handle directory patterns (e.g., "node_modules/")
        if (pattern.endsWith("/")) {
            // Remove trailing slash for consistent processing
            const dirPattern = pattern.slice(0, -1)
            // Matches the directory and its contents
            // For fast-glob, `**/dirname/**` is often redundant if `**/dirname` already implies matching contents for some interpretations,
            // but `**/dirname/` (which fast-glob might treat as `**/dirname/**`) is what .gitignore implies.
            // `**/${dirPattern}` might be enough if fast-glob treats it as matching dir and contents.
            // To be safe and explicit for directories:
            globs.push(isNegative ? `!**/${dirPattern}/**` : `**/${dirPattern}/**`)
            // Also match the directory itself if specified without contents, e.g. if one wants to ignore `foo/` but not `foo/bar.txt` if `!foo/bar.txt` is later.
            // However, `**/${dirPattern}` alone usually covers this.
            // Let's stick to the common interpretation: `dir/` means `dir` and everything inside.
        }
        // Handle patterns starting with a slash (relative to root)
        else if (pattern.startsWith("/")) {
            const rootPattern = pattern.slice(1)
            // Matches the specific file or directory at the root
            globs.push(isNegative ? `!${rootPattern}` : rootPattern, isNegative ? `!${rootPattern}/**` : `${rootPattern}/**`)
        }
        // Handle other patterns (files, or patterns without leading/trailing slashes)
        else {
            // These patterns match in any directory
            globs.push(isNegative ? `!**/${pattern}` : `**/${pattern}`, isNegative ? `!**/${pattern}/**` : `**/${pattern}/**`)
        }
    }
    return globs
}
