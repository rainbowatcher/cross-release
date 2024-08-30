import { vol } from "memfs"
import {
    describe, expect, it, vi,
} from "vitest"
import { fsJson } from "../../../tests/utils/mock_fs"
import { findProjectFiles } from "./project"

vi.mock("node:fs")
vi.mock("node:fs/promises")

vol.fromNestedJSON(fsJson)
const cwd = "/repo"

describe("findProjectFiles", () => {
    it("should return an empty array when dir is empty", () => {
        const projectFiles = findProjectFiles("")
        expect(projectFiles).toStrictEqual([])
    })

    it("should return an empty array when dir is undefined", () => {
        const projectFiles = findProjectFiles()
        expect(projectFiles).toStrictEqual([])
    })

    it("should recursively search", () => {
        const projectFiles = findProjectFiles(cwd, ["node_modules", ".git", "dist", "coverage", ".github"], true)
        expect(projectFiles.length).gte(7)
    })

    it("should return java project", () => {
        const projectFiles = findProjectFiles(`${cwd}/java`)
        const expected = [{
            category: "java",
            path: `${cwd}/java/pom.xml`,
        }]
        expect(projectFiles).toStrictEqual(expected)
    })

    it("should return rust project", () => {
        const projectFiles = findProjectFiles(`${cwd}/rust-mod1`)
        const expected = [{
            category: "rust",
            path: `${cwd}/rust-mod1/Cargo.toml`,
        }]
        expect(projectFiles).toStrictEqual(expected)
    })

    it("should return java and javascript project", () => {
        const projectFiles = findProjectFiles(cwd)
        const expected = [{
            category: "rust",
            path: `${cwd}/Cargo.toml`,
        }, {
            category: "javascript",
            path: `${cwd}/package.json`,
        }, {
            category: "java",
            path: `${cwd}/pom.xml`,
        }]
        expect(projectFiles).toStrictEqual(expected)
    })

    it("should return never[]", () => {
        expect(findProjectFiles("not/exists")).toStrictEqual([])
    })

    it("should ignore files", () => {
        const projectFiles = findProjectFiles(cwd, ["ignored", "**/pom.xml", "**/package.json"])
        const expected = [{
            category: "rust",
            path: `${cwd}/Cargo.toml`,
        }]
        expect(projectFiles).toStrictEqual(expected)
    })
})
