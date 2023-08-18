import { parse } from "semver"
import type { ProjectCategory, ProjectFile, ProjectFileName } from "./project"
import { findProjectFile, findProjectFiles } from "./project"
import {
  getJSProjectVersion,
  getJavaProjectVersion,
  getNextVersions,
  getRustProjectVersion,
  isVersionValid,
  upgradeCargoVersion,
  upgradePackageVersion,
  upgradePomVersion,
} from "./version"

export {
  type ProjectFile,
  type ProjectCategory,
  type ProjectFileName,
  findProjectFile,
  findProjectFiles,
  getJSProjectVersion,
  getJavaProjectVersion,
  getRustProjectVersion,
  upgradeCargoVersion,
  upgradePackageVersion,
  upgradePomVersion,
  getNextVersions,
  isVersionValid,
  parse as parseVersion,
}