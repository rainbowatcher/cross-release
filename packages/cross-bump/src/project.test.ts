import { describe, expect, it } from "vitest"
import { findProjectFiles } from "./project"

describe("findProjectFiles", () => {
  it("should return an empty array when dir is empty", async () => {
    const projectFiles = await findProjectFiles("")
    expect(projectFiles).toEqual([])
  })

  it("should return an empty array when dir is undefined", async () => {
    const projectFiles = await findProjectFiles()
    expect(projectFiles).toEqual([])
  })

  it("should recursively search", async () => {
    const projectFiles = await findProjectFiles(process.cwd(), ["node_modules", ".git"], true)
    expect(projectFiles.length).gte(7)
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

  it("should return java and javascript project", async () => {
    const projectFiles = await findProjectFiles("fixture")
    const expected = [{
      category: "javascript",
      path: `${process.cwd()}/fixture/package.json`,
    }, {
      category: "java",
      path: `${process.cwd()}/fixture/pom.xml`,
    }]
    expect(projectFiles).toEqual(expected)
  })

  it("should throw a error", async () => {
    await expect(() => findProjectFiles("not/exists")).rejects.toThrowError("ENOENT")
  })
})