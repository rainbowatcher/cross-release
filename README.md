[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/rainbowatcher/cross-release/ci.yml)](https://github.com/rainbowatcher/cross-release/actions)
![GitHub License](https://img.shields.io/github/license/rainbowatcher/cross-release)
[![NPM Version](https://img.shields.io/npm/v/cross-release-cli)](https://www.npmjs.com/package/cross-release-cli)

# Cross Release

> a release tool that support multi programming language

## Feature

- Support Java/JavaScript/Rust
  > current support `package.json`/`pom.xml`/`Cargo.toml`
- Prompt based cli operation
- Monorepo support
- Easy to use

## Packages

| Package                                                                                                            | Description                        |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| [cross-bump](https://github.com/rainbowatcher/cross-release/blob/main/packages/cross-bump/README.md)               | cross language bump utility        |
| [cross-release-cli](https://github.com/rainbowatcher/cross-release/blob/main/packages/cross-release-cli/README.md) | command line app for cross-release |

## Roadmap

- [x] bump
- [x] git (tag/push)
- [x] user config
- [ ] tauri support
- [ ] changelog
- [ ] release github action

## License

[MIT](https://github.com/rainbowatcher/cross-release/blob/main/LICENSE).
