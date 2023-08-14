import { describe, expect, it } from "vitest"
import { findProjectFile, findProjectFiles } from "./project"

describe("findProjectFiles", () => {
  it("should use process.cwd as root when directory is empty string", async () => {
    const projectFiles = await findProjectFiles("")
    expect(projectFiles.length).gt(0)
  })

  it("should use process.cwd as root when directory is undefined", async () => {
    const projectFiles = await findProjectFiles()
    expect(projectFiles.length).gt(0)
  })

  it("should return java project", async () => {
    const projectFiles = await findProjectFiles("fixture/java")
    const expected = [{
      category: "java",
      path: `${process.cwd()}/fixture/java/pom.xml`,
    }]
    expect(projectFiles).toEqual(expected)
  })

  it("should return rust project", async () => {
    const projectFiles = await findProjectFiles("fixture/rust")
    const expected = [{
      category: "rust",
      path: `${process.cwd()}/fixture/rust/Cargo.toml`,
    }]
    expect(projectFiles).toEqual(expected)
  })

  it("should throw a error", async () => {
    await expect(() => findProjectFiles("not/exists")).rejects.toThrowError("ENOENT")
  })
})

describe("findProjectFile", () => {
  it("should return project root's package.json when no argument is passed", async () => {
    const projectFile = await findProjectFile()
    const expected = {
      category: "javascript",
      path: `${process.cwd()}/package.json`,
    }
    expect(projectFile).toEqual(expected)
  })

  it("should first look for the package.json file", async () => {
    const projectFile = await findProjectFile("fixture")
    const expected = {
      category: "javascript",
      path: `${process.cwd()}/fixture/package.json`,
    }
    expect(projectFile).toEqual(expected)
  })

  it("should return undefined", async () => {
    const projectFile = await findProjectFile("docs")
    expect(projectFile).toBeUndefined()
  })

  it("should return throw a error", async () => {
    await expect(() => findProjectFile("not/exists")).rejects.toThrowError()
  })
})