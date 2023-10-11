import { BARE_IMPORT_RE, EXTERNAL_TYPES } from "../constants.js";
import path from "path";
import fs from "fs-extra";
import { createPluginContainer } from "../plugins/pluginContainer.js";
import { resolvePlugins } from "../plugins/resolvePlugins.js";

const root = process.cwd();

export function scanPlugin(deps, ctx) {
  return {
    name: "esbuild:scan-deps",
    setup(build) {
      // 忽略的文件类型
      build.onResolve(
        { filter: new RegExp(`\\.(${EXTERNAL_TYPES.join("|")})$`) },
        (resolveInfo) => {
          return {
            path: resolveInfo.path,
            // 非JS文件不需要扫描，不会引入其他模块
            external: true,
          };
        }
      );
      // 记录裸模块
      build.onResolve(
        {
          filter: BARE_IMPORT_RE,
        },
        (resolveInfo) => {
          const { path: id } = resolveInfo;
          deps.add(id);
        }
      );

      // 解析绝对路径开头的导入
      build.onResolve(
        {
          filter: /^\/.*$/,
        },
        async (resolveInfo) => {
          const resolved = await ctx.pluginContainer.resolveId(
            resolveInfo.path
          );
          return {
            path: resolved.id,
          };
        }
      );
    },
  };
}
