import * as fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { isBlankPath } from "./util"
import type { PathLike } from "node:fs"

const supportedProjectCategory = ["java", "javascript", "rust"/* , "go" */] as const
const supportedProjectFiles = ["package.json", "pom.xml", "Cargo.toml"] as const
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
 * @param excludes - The directories to exclude from the search.
 * @param recursive - Whether to recursively search. @default false
 * @return An array of file paths that match the search criteria.
 */
export async function findProjectFiles(dir?: PathLike, excludes?: string[], recursive = false): Promise<ProjectFile[]> {
    const files: ProjectFile[] = []
    if (isBlankPath(dir)) {
        return files
    }

    const dirEntries = await fs.readdir(dir, { withFileTypes: true })
    for await (const dirEntry of dirEntries) {
        const { name: filename } = dirEntry
        if (excludes?.includes(filename)) continue
        const filePath = path.resolve(process.cwd(), dir.toString(), filename)
        if (recursive && dirEntry.isDirectory()) {
            files.push(...await findProjectFiles(filePath, excludes, recursive))
        } else if (supportedProjectFiles.includes(filename as ProjectFileName)) {
            files.push({
                category: projectCategoryMap[filename as ProjectFileName],
                path: filePath,
            })
        }
    }
    return files
}
