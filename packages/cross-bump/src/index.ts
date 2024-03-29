import { parse } from "semver"
import type { ProjectCategory, ProjectFile, ProjectFileName } from "./project"
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

export {
  // types
  type ProjectFile,
  type ProjectCategory,
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
  upgradeCargoVersion,
  upgradePackageVersion,
  upgradePomVersion,
  upgradeProjectVersion,
  // re-export from semver
  parse as parseVersion,
}