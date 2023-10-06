import { BARE_IMPORT_RE, EXTERNAL_TYPES } from "../constants.js";
import { init, parse } from "es-module-lexer";
import path from "path";
import resolve from "resolve";
import fs from "fs-extra";
import { normalizePath } from "../util.js";

export function preBundlePlugin(deps) {
  return {
    name: "esbuild:preBundlePlugin",
    setup(build) {
      // 忽略的文件类型
      build.onResolve(
        { filter: new RegExp(`\\.(${EXTERNAL_TYPES.join("|")})$`) },
        (resolveInfo) => {
          return {
            external: true,
          };
        }
      );

      build.onResolve({ filter: BARE_IMPORT_RE }, (resolveInfo) => {
        const { path: id } = resolveInfo;
        return {
          path: resolve.sync(id, { basedir: process.cwd() }),
        };
      });
    },
  };
}
