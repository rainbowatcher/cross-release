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
        "release": "cross-release"
    }
}
```

3. run release script

```shell
pnpm run release
```

## Command line

| short | long                   | description                                         | default                                         |
| ----- | ---------------------- | --------------------------------------------------- | ----------------------------------------------- |
| -V    | --version              | output the version number                           | false                                           |
| -a    | --all                  | Add all changed files to staged                     | false                                           |
| -c    | --config [file]        | Config file                                         | auto detect                                     |
| -D    | --dry                  | Dry run                                             | false                                           |
| -d    | --debug                | Enable debug mode                                   | false                                           |
| -e    | --exclude [dir]        | Folders to exclude from search                      | ["node_modules",".git","target","build","dist"] |
| -m    | --main                 | Base project language [e.g. java, rust, javascript] | "javascript"                                    |
| -r    | --recursive            | Run the command for each project in the workspace   | false                                           |
| -x    | --execute [command...] | Execute the command                                 | []                                              |
| -y    | --yes                  | Answer yes to all prompts                           | false                                           |
|       | --cwd [dir]            | Set working directory                               | process.cwd()                                   |
| -c    | --no-commit            | Skip committing changes                             | false                                           |
| -p    | --no-push              | Skip pushing                                        | false                                           |
| -t    | --no-tag               | Skip tagging                                        | false                                           |
| -h    | --help                 | Display this message                                | false                                           |

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
