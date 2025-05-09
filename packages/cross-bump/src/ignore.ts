import { readFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import fg from "fast-glob"

export const DEFAULT_IGNORED_GLOBS: string[] = ["**/node_modules/**", "**/.git/**", "**/target/**", "**/build/**", "**/dist/**"]
export const G_GITIGNORE = "**/.gitignore"

export function getGitignores(cwd?: string, ignoreGlobs = DEFAULT_IGNORED_GLOBS): Set<string> {
    const gitignoreFiles = fg.sync(G_GITIGNORE, {
        absolute: true, // Returns absolute paths for .gitignore files
        cwd,
        ignore: ignoreGlobs,
        onlyFiles: true,
    })
    const set = new Set<string>()
    for (const gitignoreFilePath of gitignoreFiles) { // gitignoreFilePath is absolute
        const rules = readFileSync(gitignoreFilePath, { encoding: "utf8" })
        const globs = parseGitingore(rules, gitignoreFilePath, cwd = process.cwd())
        if (globs.length === 0) continue
        for (const item of globs) {
            set.add(item)
        }
    }
    return set
}

type ProcessResult = {
    cleanedLine: string
    isNegative?: boolean
    shouldSkip?: boolean
}

/**
 * Processes a raw line from .gitignore content.
 * Handles empty lines, comments, trailing whitespace
 */
function processRawGitignoreLine(rawLine: string): ProcessResult {
    let line = rawLine.trimStart()

    // Rule: A blank line matches no files
    // Rule: A line starting with # serves as a comment.
    if (line.length === 0 || line.startsWith("#")) {
        return { cleanedLine: "", shouldSkip: true }
    }

    line = normalizeIgnoreRule(line)
    let isNegative = false

    // Rule: Trailing spaces are ignored unless they are quoted with backslash ("\ ").
    if (/\\\s*$/.test(line)) {
        line = `${line.replace(/\\\s*$/, "")} `
    } else {
        line = line.trimEnd()
    }

    if (line.startsWith("!")) {
        line = line.slice(1)
        isNegative = true
    }
    return { cleanedLine: line, isNegative }
}


/**
 * Converts the gitignore pattern to a glob pattern relative to the project root.
 * @param result The processed gitignore line result
 * @param gitignoreFileDirAbs Absolute path to the directory containing the .gitignore file.
 * @param projectRoot Absolute path to the project root.
 */
function toRelativeGlob(
    result: ProcessResult,
    gitignoreFileDirAbs: string,
    projectRoot: string,
): string {
    const { cleanedLine, isNegative } = result
    const pattern = cleanedLine.replaceAll(/\\([# !])/g, "$1")
    const relativeGitignoreDir = path.relative(projectRoot, gitignoreFileDirAbs)

    let glob: string

    if (pattern.includes("/")) {
        const _pattern = pattern.startsWith("/")
            ? pattern.slice(1)
            : (pattern.startsWith("**/")
                ? pattern
                : `**/${(pattern.endsWith("/") ? pattern.slice(0, -1) : pattern)}`)

        const targetPath = path.resolve(gitignoreFileDirAbs, _pattern)
        glob = path.relative(projectRoot, targetPath) || "."
    } else {
        // simple pattern like '*.log ' | 'file.txt'
        glob = path.join(relativeGitignoreDir, "**", pattern)
    }

    // pattern like '/' | '*' | '.'
    if (glob === "*" || glob === ".") {
        glob = path.join(relativeGitignoreDir, glob)
    }

    return isNegative ? `!${glob}` : glob
}

/**
 * Normalizes the gitignore rule
 * Converts path separators to `/`, removes leading `./`, and handles empty globs.
 */
function normalizeIgnoreRule(glob: string): string {
    let normalized = glob.replaceAll("\\\\", "/")
    if (normalized.startsWith("./")) {
        normalized = normalized.slice(2)
    }
    if (normalized === "") {
        normalized = "."
    }
    return normalized
}

/**
 * Parses gitignore content into an array of glob patterns.
 *
 * rules ref: https://git-scm.com/docs/gitignore#_pattern_format
 *
 * @param content The content of the .gitignore file.
 * @param gitignoreFilePath Absolute path to the .gitignore file.
 * @param projectRoot Absolute path to the project root (cwd for fast-glob).
 * @returns An array of glob patterns.
 */
export function parseGitingore(content: string, gitignoreFilePath: string, projectRoot: string): string[] {
    const resultGlobs: string[] = []
    const lines = content.split(/\r\n?|\n/)
    const gitignoreFileDirAbs = path.dirname(gitignoreFilePath)

    for (const rawLine of lines) {
        const result = processRawGitignoreLine(rawLine)
        if (result.shouldSkip) {
            continue
        }

        const relativeGlob = toRelativeGlob(result, gitignoreFileDirAbs, projectRoot)

        resultGlobs.push(relativeGlob)
        if (!relativeGlob.endsWith("*") && relativeGlob !== ".") {
            resultGlobs.push(`${relativeGlob}/**`)
        }
    }
    return [...new Set(resultGlobs)] // Deduplicate
}
