import process from "node:process"
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
        const projectFiles = await findProjectFiles(process.cwd(), ["node_modules", ".git", "dist", "coverage", ".github"], true)
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
        const projectFiles = await findProjectFiles("fixture/rust-mod1")
        const expected = [{
            category: "rust",
            path: `${process.cwd()}/fixture/rust-mod1/Cargo.toml`,
        }]
        expect(projectFiles).toEqual(expected)
    })

    it("should return java and javascript project", async () => {
        const projectFiles = await findProjectFiles("fixture")
        const expected = [{
            category: "rust",
            path: `${process.cwd()}/fixture/Cargo.toml`,
        }, {
            category: "javascript",
            path: `${process.cwd()}/fixture/package.json`,
        }, {
            category: "java",
            path: `${process.cwd()}/fixture/pom.xml`,
        }]
        expect(projectFiles).toEqual(expected)
    })

    it("should return never[]", async () => {
        expect(await findProjectFiles("not/exists")).toEqual([])
    })

    it("should ignore files", async () => {
        const projectFiles = await findProjectFiles("fixture", ["ignored", "**/pom.xml", "**/package.json"])
        const expected = [{
            category: "rust",
            path: `${process.cwd()}/fixture/Cargo.toml`,
        }]
        expect(projectFiles).toEqual(expected)
    })
})
