import dedent from "dedent"

const javaSubJson = {
    "pom.xml": dedent`
        <project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://maven.apache.org/POM/4.0.0" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
            <modelVersion>4.0.0</modelVersion>
            <parent>
                <groupId>com.example</groupId>
                <artifactId>cross-bump-parent</artifactId>
                <version>1.1.1</version>
            </parent>
            <groupId>com.example</groupId>
            <artifactId>cross-bump</artifactId>
            <version>1.1.1</version>
            <packaging>jar</packaging>
            <name>cross-bump project</name>
        </project>
    `,
}

const rustMod1Json = {
    "Cargo.toml": dedent`
        [package]
        name = "cross-bump"
        authors = ["rainbowatcher"]
        edition = "2021"
        version = "1.1.1"
        rust-version = "1.70"

        [dependencies]
        syn = { version = "1.0", features = ["full"] }

        [dependencies.proc-macro2]
        version = "1.0"
        features = ["span-locations"]
    `,
}

const rustMod2Json = {
    "Cargo.toml": dedent`
        [package]
        name = "cross-bump"
        authors = ["rainbowatcher"]
        edition = "2021"
        rust-version = "1.70"

        [package.version]
        workspace = true
    `,
}

const ignored = {
    "package.json": dedent`
        {
            "name": "cross-bump-ignored",
            "version": "1.1.1",
            "private": true,
            "cross-release": {
                "excludes": [
                    "fixture",
                    "test"
                ]
            }
        }
    `,
}

export const fsJson = {
    "/repo": {
        ".gitignore": "ignored",
        "Cargo.toml": dedent`
            [workspace]
            members = ["rust/*"]

            [workspace.package]
            version = "1.1.1"
        `,
        "cross-release.config.cjs": dedent`
            module.exports = {
                "push": false
            }
        `,
        "cross-release.config.json": dedent`
            {
                "push": false
            }
        `,
        "cross-release.config.mjs": dedent`
            export default {
                "push": false
            }
        `,
        ignored,
        java: javaSubJson,
        "package.json": dedent`
            {
                "name": "cross-bump",
                "version": "1.1.1",
                "private": true,
                "cross-release": {
                    "excludes": [
                        "fixture",
                        "test"
                    ]
                }
            }
        `,
        "pom.xml": dedent`
            <project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://maven.apache.org/POM/4.0.0" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.example</groupId>
                <artifactId>cross-bump-parent</artifactId>
                <version>1.1.1</version>
                <packaging>jar</packaging>
                <name>cross-bump project</name>
            </project>
        `,
        "rust-mod1": rustMod1Json,
        "rust-mod2": rustMod2Json,
    },
}
