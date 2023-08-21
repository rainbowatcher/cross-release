import * as fs from "node:fs/promises"
import path from "node:path"
import type { PathLike } from "node:fs"
import { isBlankPath } from "./util"

const supportedProjectCategory = ["java", "javascript", "rust"/* , "go" */] as const
const supportedProjectFiles = ["package.json", "pom.xml", "Cargo.toml"] as const
export type ProjectCategory = typeof supportedProjectCategory[number]
export type ProjectFileName = typeof supportedProjectFiles[number]

const projectCategoryMap: Record<ProjectFileName, ProjectCategory> = {
  "pom.xml": "java",
  "package.json": "javascript",
  "Cargo.toml": "rust",
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

const DEFAULT_EXCLUDE = ["node_modules", ".git"]
/**
 * Searches for all project files in the specified directory and its subdirectories.
 *
 * @param root - The directory to search in.
 * @param excludes - The directories to exclude from the search.
 * @return An array of file paths that match the search criteria.
 */
export async function findProjectFiles(root?: PathLike, excludes?: string[]): Promise<ProjectFile[]> {
  const files: ProjectFile[] = []
  const searchRoot = !isBlankPath(root) ? root : process.cwd()
  const excludeDirs = Object.assign(DEFAULT_EXCLUDE, excludes)
  const dirEntries = await fs.readdir(searchRoot, { withFileTypes: true })
  for await (const dirEntry of dirEntries) {
    const { name: filename } = dirEntry
    if (excludeDirs.includes(filename)) continue
    const filePath = path.resolve(process.cwd(), searchRoot.toString(), filename)
    if (dirEntry.isDirectory()) {
      files.push(...(await findProjectFiles(filePath)))
    } else if (supportedProjectFiles.includes(filename as ProjectFileName)) {
      files.push({
        category: projectCategoryMap[filename as ProjectFileName],
        path: filePath,
      })
    }
  }
  return files
}

export async function findProjectFile(root?: PathLike, excludes?: string[]): Promise<ProjectFile | undefined> {
  const searchRoot = !isBlankPath(root) ? root : process.cwd()
  const excludeDirs = Object.assign(DEFAULT_EXCLUDE, excludes)
  const dirEntries = await fs.readdir(searchRoot, { withFileTypes: true })
  for await (const dirEntry of dirEntries) {
    const { name: filename } = dirEntry
    if (excludeDirs.includes(filename)) continue
    const filePath = path.resolve(process.cwd(), searchRoot.toString(), filename)
    if (supportedProjectFiles.includes(filename as ProjectFileName)) {
      return {
        category: projectCategoryMap[filename as ProjectFileName],
        path: filePath,
      }
    }
  }
}