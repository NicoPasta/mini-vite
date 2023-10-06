import { BARE_IMPORT_RE, EXTERNAL_TYPES } from "../constants.js";

export function scanPlugin(deps) {
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
    },
  };
}
