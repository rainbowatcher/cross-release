# Cross Release CLI

## Usage

1. install through package manager

```shell
# pnpm
pnpm i cross-release -g
```

otherwise you can use you favorite package manager instead

```shell
# npm
npm i cross-release -g
# yarn
yarn add cross-release --global
```

2. add to your package.json

```json
{
    "scripts": {
        "release": "cross-release"
    }
}
```

3. run release script

```shell
pnpm run release
```

## Command line

| short | long            | description                                         | default                    |
| ----- | --------------- | --------------------------------------------------- | -------------------------- |
| -m    | --main          | Main project language e.g. java / javascript / rust | `false`                    |
| -r    | --recursive     | Run the command for each project in the workspace   | `false`                    |
| -d    | --dry           | Dry run                                             | `false`                    |
| -D    | --dir [dir]     | Set working directory                               | `project root`             |
| -c    | --commit        | Commit current changes                              | `false`                    |
| -p    | --push          | Push the project to remote                          | `false`                    |
| -t    | --tag           | Create a tag for current version                    | `false`                    |
| -e    | --exclude [dir] | Folders to exclude from search                      | `["node_modules", ".git"]` |
| -y    | --yes           | Answer yes to all prompts                           | `false`                    |

## Configuration

You can specify various runtime settings by using the "package.json" file. Here are some examples that cover all the parameters:

```json
{
    "...": "...",
    "cross-release": {
    // show the help message
        "showHelp": false,
        // show the version about cross-release
        "showVersion": false,
        "version": "",
        "isAllYes": false,
        "isDry": false,
        "isRecursive": false,
        "shouldCommit": false,
        "shouldPush": false,
        "shouldTag": false,
        // default exclude folders are `["node_modules", ".git"]`, your config will be append within it
        "excludes": ["path/to/exclude"],
        "dir": "/path/to/run",
        "commit": {
            // Whether to invoke git pre-commit and commit-msg hook
            "shouldVerify": true,
            // Whether to stage all un-staged files or stage only changed files
            "shouldStageAll": false,
            // the symbol '%s' will be replace to the version number that you specified
            "template": "chore: release v%s"
        },
        "push": {
            "shouldFollowTags": false
        }
    }
}
```
