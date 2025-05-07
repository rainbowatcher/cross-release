import fs from "node:fs"
import path from "node:path"
import fg from "fast-glob"
import { isBlankPath } from "./util"

export const supportedProjectCategory = ["java", "javascript", "rust"] as const
export const supportedProjectFiles = ["package.json", "pom.xml", "Cargo.toml"] as const
export const supportedProjectGlobs = supportedProjectFiles.map(f => `**/${f}`)
export type ProjectCategory = typeof supportedProjectCategory[number]
export type ProjectFileName = typeof supportedProjectFiles[number]

const projectCategoryMap: Record<ProjectFileName, ProjectCategory> = {
    "Cargo.toml": "rust",
    "package.json": "javascript",
    "pom.xml": "java",
    // go: "go.mod",
}

export type ProjectFile = {
    /**
     * project category
     */
    category: ProjectCategory

    /**
     * project file path
     */
    path: string
}

/**
 * Searches for all project files in the specified directory and its subdirectories.
 *
 * @param dir - The directory to search in.
 * @param ignore - The directories to exclude from the search.
 * @param recursive - Whether to recursively search. @default false
 * @return An array of file paths that match the search criteria.
 */
export function findProjectFiles(cwd?: string, ignore: string[] = [], recursive = false): ProjectFile[] {
    const files: ProjectFile[] = []
    if (isBlankPath(cwd)) {
        return files
    }

    const projectFiles = fg.sync(supportedProjectGlobs, {
        absolute: true,
        cwd,
        deep: recursive ? Infinity : 1,
        fs,
        ignore,
    })

    return projectFiles.map(f => ({
        category: projectCategoryMap[path.basename(f) as ProjectFileName],
        path: f,
    }))
}
