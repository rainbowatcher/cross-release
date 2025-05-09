import process from "node:process"
import dedent from "dedent"
import { describe, expect, it } from "vitest"
import { getGitignores, parseGitingore } from "./ignore"

// Mock paths for testing parseGitingore
const MOCK_PROJECT_ROOT = "/project" // Assuming project root for these tests
const MOCK_GITIGNORE_PATH = `${MOCK_PROJECT_ROOT}/.gitignore` // Assuming .gitignore is at the root for simplicity

describe("getGitignores", () => {
    it("should initialize the set with predefined ignore patterns", () => {
        const set = getGitignores("not-exists-dir")
        expect(set.size).toBe(0)
    })

    it("should update the set with patterns from existing .gitignore files", () => {
        const set = getGitignores(`${process.cwd()}/fixture`)
        expect(set.size).toBe(3)
        expect(set.has("fixture/**/ignored")).toBeTruthy()
        expect(set.has("fixture/**/ignored/**")).toBeTruthy()
        expect(set.has("fixture/gitignore/**/*")).toBeTruthy()
        expect(set.has("pattern2")).toBeFalsy()
    })

    it("should be defined", () => {
        let set = getGitignores(process.cwd())
        expect(set).toBeDefined()
        set = getGitignores(`${process.cwd()}/packages`)
        expect(set).toBeDefined()
        expect(set).toStrictEqual(new Set())

        set = getGitignores(undefined)
        expect(set).toBeDefined()
    })
})

describe("parseGitingore", () => {
    it("should ignore empty lines and comments", () => {
        const content = dedent`
            # This is a comment
            file1.txt

               # Another comment
            file2.js
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["**/file1.txt", "**/file1.txt/**", "**/file2.js", "**/file2.js/**"])
    })

    it("should handle simple file patterns", () => {
        const content = dedent`
            file.txt
            *.log
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["**/file.txt", "**/file.txt/**", "**/*.log", "**/*.log/**"])
    })

    it("should handle directory patterns", () => {
        const content = dedent`
            node_modules/
            build/
            fixture/mod/
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/node_modules",
            "**/node_modules/**",
            "**/build",
            "**/build/**",
            "**/fixture/mod",
            "**/fixture/mod/**",
        ])
    })

    it("should handle negated patterns", () => {
        const content = dedent`
            *.log
            !important.log
            dist/
            !dist/keep.txt
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/*.log",
            "**/*.log/**",
            "!**/important.log",
            "!**/important.log/**",
            "**/dist",
            "**/dist/**",
            "!**/dist/keep.txt",
            "!**/dist/keep.txt/**",
        ])
    })

    it("should handle patterns starting with a slash (relative to .gitignore root)", () => {
        const content = dedent`
            /file.txt
            /docs/
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        // For MOCK_GITIGNORE_PATH = /project/.gitignore, /file.txt becomes file.txt relative to projectRoot
        expect(globs).toStrictEqual(["file.txt", "file.txt/**", "docs", "docs/**"])
    })

    it("should handle patterns that are already globs", () => {
        const content = dedent`
            **/test/*.spec.ts
            src/**/*.js
            !**/temp/**
        `
        // These are already globs relative to project root
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/test/*.spec.ts",
            "**/test/*.spec.ts/**",
            "**/src/**/*.js",
            "**/src/**/*.js/**",
            "!**/temp/**",
        ])
    })

    it("should handle mixed patterns", () => {
        const content = dedent`
            # General
            *.tmp
            cache/

            # Specific
            !important.tmp
            /config.json
            !/config.backup.json

            # Globs
            **/*.test.js
            !src/utils/dont-test.js
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/*.tmp",
            "**/*.tmp/**",
            "**/cache",
            "**/cache/**",
            "!**/important.tmp",
            "!**/important.tmp/**",
            "config.json", // From /config.json
            "config.json/**",
            "!config.backup.json", // From !/config.backup.json
            "!config.backup.json/**",
            "**/*.test.js",
            "**/*.test.js/**",
            "!**/src/utils/dont-test.js", // Relative to .gitignore location
            "!**/src/utils/dont-test.js/**",
        ])
    })

    it("should handle patterns with leading/trailing spaces (and ensure they are trimmed)", () => {
        const content = dedent`
            file.txt  
            ! excluded.log  
            dir/  
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/file.txt",
            "**/file.txt/**",
            "!**/ excluded.log",
            "!**/ excluded.log/**",
            "**/dir",
            "**/dir/**",
        ])
    })

    it("should handle complex negated patterns", () => {
        const content = dedent`
            foo/
            !foo/bar
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/foo",
            "**/foo/**",
            "!**/foo/bar",
            "!**/foo/bar/**",
        ])
    })

    // New tests based on gitignore.txt rules
    it("handles escaped hash, exclamation, and spaces", () => {
        const content = dedent`
            \#file.txt
            \!important.log
            file\ with\ spaces.doc
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/#file.txt",
            "**/#file.txt/**",
            "**/!important.log",
            "**/!important.log/**",
            "**/file with spaces.doc",
            "**/file with spaces.doc/**",
        ])
    })

    it("handles patterns relative to .gitignore location", () => {
        // .gitignore is at /project/.gitignore, projectRoot is /project
        // A pattern like "mydir/myfile.txt" in /project/.gitignore
        const content = "mydir/myfile.txt"
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        // path.resolve("/project", "mydir/myfile.txt") -> /project/mydir/myfile.txt
        // path.relative("/project", "/project/mydir/myfile.txt") -> mydir/myfile.txt
        expect(globs).toStrictEqual(["**/mydir/myfile.txt", "**/mydir/myfile.txt/**"])

        // Test with a .gitignore in a subdirectory
        const subGitignorePath = `${MOCK_PROJECT_ROOT}/subdir/.gitignore`
        const content2 = "another.txt"
        // parseGitingore(content, "/project/subdir/.gitignore", "/project")
        // gitignoreFileDirAbs = "/project/subdir"
        // relativeGitignoreDir = "subdir"
        // glob for "another.txt" becomes "subdir/**/another.txt"
        const globs2 = parseGitingore(content2, subGitignorePath, MOCK_PROJECT_ROOT)
        expect(globs2).toStrictEqual(["subdir/**/another.txt", "subdir/**/another.txt/**"])

        const content3 = "/root_level_in_subdir.txt"
        // parseGitingore(content, "/project/subdir/.gitignore", "/project")
        // pattern.startsWith("/") -> targetPath = path.resolve("/project/subdir", "root_level_in_subdir.txt")
        // glob = path.relative("/project", "/project/subdir/root_level_in_subdir.txt") -> "subdir/root_level_in_subdir.txt"
        const globs3 = parseGitingore(content3, subGitignorePath, MOCK_PROJECT_ROOT)
        expect(globs3).toStrictEqual(["subdir/root_level_in_subdir.txt", "subdir/root_level_in_subdir.txt/**"])
    })

    it("handles '/**/' for zero or more directories", () => {
        const content = "a/**/b"
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["**/a/**/b", "**/a/**/b/**"])
    })

    it("handles trailing '/**' for everything inside", () => {
        const content = "abc/**"
        // relative to .gitignore location
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["**/abc/**"]) // "abc/**" is already a glob
    })

    it("handles leading '**/foo' for foo anywhere", () => {
        const content = "**/foo"
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["**/foo", "**/foo/**"]) // new logic adds /** for potential dir
    })

    it("handles '**/foo/bar' for bar under foo anywhere", () => {
        const content = "**/foo/bar"
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["**/foo/bar", "**/foo/bar/**"]) // new logic adds /** for potential dir
    })

    it("handles a single '/' to ignore files in .gitignore's directory (if it's a dir pattern)", () => {
        const content = "/"
        // gitignoreFilePath = /project/.gitignore, projectRoot = /project
        // pattern becomes "", isDirPattern = true
        // glob becomes "."
        // resultGlobs.push(".", "**/*")
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual(["."])
    })

    it("handles edge cases", () => {
        const content = dedent`
            # single whitespace
            \ 
            \  
            # single backslash
            \\ 
            file\\.txt
            file.txt        \ 
            file.txt\ \ \ 
            file with space.txt
            file\ with\ escaped\ space.txt
            file\ with\ escaped\ space\ .txt
        `
        const globs = parseGitingore(content, MOCK_GITIGNORE_PATH, MOCK_PROJECT_ROOT)
        expect(globs).toStrictEqual([
            "**/ ",
            "**/ /**",
            ".",
            String.raw`**/file/.txt`,
            String.raw`**/file/.txt/**`,
            "**/file.txt         ",
            "**/file.txt         /**",
            "**/file.txt   ",
            "**/file.txt   /**",
            "**/file with space.txt",
            "**/file with space.txt/**",
            "**/file with escaped space.txt",
            "**/file with escaped space.txt/**",
            "**/file with escaped space .txt",
            "**/file with escaped space .txt/**",
        ])
    })
})
