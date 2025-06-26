# Cross Release CLI

## Usage

1. install through package manager

```shell
pnpm i -D cross-release
```

2. add a release script in your package.json

```json
{
    "scripts": {
        "release": "cross-release -ax 'pnpm changelog' && pnpm build && pnpm -r publish",
        "changelog": "conventional-changelog -si CHANGELOG.md",
    }
}
```

3. run release script

```shell
pnpm run release
```

## Command line

```
Usage:
  $ cross-release [version] [options]

Options:
  -v, --version                 Display version number
  -a, --all                     shortcut for --commit.stageAll
  -c, --config [file]           Config file (auto detect by default)
  -D, --dry                     Dry run
  -d, --debug                   Enable debug mode
  -e, --exclude [dir...]        Folders to exclude from search
  -m, --main [lang]             Base project language [e.g. java, rust, javascript]
  -r, --recursive               Run the command for each project in the workspace
  -x, --execute [command...]    Execute the command
  -y, --yes                     Answer yes to all prompts
  --cwd [dir]                   Set working directory
  --commit                      Committing changes
  --commit.signoff              Commit with signoff
  --commit.stageAll             Stage all changes before commit
  --commit.template <template>  Template for commit message
  --commit.verify               Verify commit message
  --push                        Pushing Commit to remote
  --push.followTags             Pushing with follow tags
  --push.branch <branch>        Branch name to push
  --tag                         Tagging for release
  --tag.template <template>     Template for tag message
  -h, --help                    Display this message
```

## Configuration

supportted file name:

- `cross-release.config.js`
- `cross-release.config.cjs`
- `cross-release.config.mjs`
- `cross-release.config.ts`
- `cross-release.config.cts`
- `cross-release.config.mts`
- `cross-release.config.json`
- `package.json`

Here are some examples that cover all the parameters:

```ts
export default {
    // ...
    "cross-release": {
        // "commit": false,
        commit: {
            signoff: true,
            // Whether to stage all un-staged files or stage only changed files
            stageAll: false,
            // the symbol '%s' will be replace to the version number that you specified
            template: "chore: release v%s",
            // Whether to invoke git pre-commit and commit-msg hook
            verify: true,
        },
        cwd: "/path/to/run",
        dry: false,
        // Your config will be append within default exclude folders
        excludes: ["path/to/exclude"],
        // use for read current version number
        main: "javascript",
        // "push": false,
        push: {
            branch: false,
            followTags: false,
        },
        recursive: false,
        // tag: false,
        tag: {
            template: "v%s",
        },
        version: "",
        yes: false,
    },
}
```

example for config in `package.json`

```jsonc
{
    // ...
    "cross-release": {
        "yes": true,
        "commit": true,
        "tag": {
            "template": "v%s",
        },
    }
}
```
