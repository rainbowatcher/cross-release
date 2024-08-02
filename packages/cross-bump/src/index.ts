import { parse } from "semver"
import { findProjectFiles } from "./project"
import {
    getJavaProjectVersion,
    getJSProjectVersion,
    getNextVersions,
    getProjectVersion,
    getRustProjectVersion,
    isVersionValid,
    upgradeCargoVersion,
    upgradePackageVersion,
    upgradePomVersion,
    upgradeProjectVersion,
} from "./version"
import type { ProjectCategory, ProjectFile, ProjectFileName } from "./project"

// version related
export {
    getJavaProjectVersion,
    getJSProjectVersion,
    getNextVersions,
    getProjectVersion,
    getRustProjectVersion,
    isVersionValid,
    upgradeCargoVersion,
    upgradePackageVersion,
    upgradePomVersion,
    upgradeProjectVersion,
}

// re-export from semver
export { parse as parseVersion }

// project related
export { findProjectFiles }

// types
export type {
    ProjectCategory,
    ProjectFile,
    ProjectFileName,
}
