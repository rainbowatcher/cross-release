import { describe, expect, it } from "vitest"
import { findProjectFile, findProjectFiles } from "./project"

describe("findProjectFiles", () => {
  it("should use process.cwd as root when directory is empty string", async () => {
    const files = await findProjectFiles("")
    expect(files).toMatchInlineSnapshot(`
      [
        {
          "category": "java",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/java/pom.xml",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/package.json",
        },
        {
          "category": "java",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/pom.xml",
        },
        {
          "category": "rust",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/rust/Cargo.toml",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/package.json",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/packages/cross-bump/package.json",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/packages/cross-bump-cli/package.json",
        },
      ]
    `)
  })

  it("should use process.cwd as root when directory is undefined", async () => {
    const files = await findProjectFiles()
    expect(files).toMatchInlineSnapshot(`
      [
        {
          "category": "java",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/java/pom.xml",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/package.json",
        },
        {
          "category": "java",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/pom.xml",
        },
        {
          "category": "rust",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/rust/Cargo.toml",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/package.json",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/packages/cross-bump/package.json",
        },
        {
          "category": "javascript",
          "path": "/Users/rainb/WorkSpace/Private/unbump/packages/cross-bump-cli/package.json",
        },
      ]
    `)
  })

  it("should return java project", async () => {
    const files = await findProjectFiles("fixture/java")
    expect(files).toMatchInlineSnapshot(`
      [
        {
          "category": "java",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/java/pom.xml",
        },
      ]
    `)
  })

  it("should return rust project", async () => {
    const files = await findProjectFiles("fixture/rust")
    expect(files).toMatchInlineSnapshot(`
      [
        {
          "category": "rust",
          "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/rust/Cargo.toml",
        },
      ]
    `)
  })

  it("should throw a error", async () => {
    await expect(() => findProjectFiles("not/exists")).rejects.toThrowError("ENOENT")
  })
})

describe("findProjectFile", () => {
  it("should return project root's package.json when no argument is passed", async () => {
    const result = await findProjectFile()
    expect(result).toMatchInlineSnapshot(`
      {
        "category": "javascript",
        "path": "/Users/rainb/WorkSpace/Private/unbump/package.json",
      }
    `)
  })

  it("should first look for the package.json file", async () => {
    const result = await findProjectFile("fixture")
    expect(result).toMatchInlineSnapshot(`
      {
        "category": "javascript",
        "path": "/Users/rainb/WorkSpace/Private/unbump/fixture/package.json",
      }
    `)
  })

  it("should return undefined", async () => {
    const result = await findProjectFile("docs")
    expect(result).toBeUndefined()
  })

  it("should return throw a error", async () => {
    await expect(() => findProjectFile("not/exists")).rejects.toThrowError()
  })
})