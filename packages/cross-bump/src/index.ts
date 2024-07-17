import { parse } from "semver"
import { findProjectFiles } from "./project"
import {
    getJSProjectVersion,
    getJavaProjectVersion,
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

export {
    type ProjectCategory,
    // types
    type ProjectFile,
    type ProjectFileName,
    // project related
    findProjectFiles,
    // version related
    getJSProjectVersion,
    getJavaProjectVersion,
    getNextVersions,
    getProjectVersion,
    getRustProjectVersion,
    isVersionValid,
    // re-export from semver
    parse as parseVersion,
    upgradeCargoVersion,
    upgradePackageVersion,
    upgradePomVersion,
    upgradeProjectVersion,
}
