import { BARE_IMPORT_RE, EXTERNAL_TYPES } from "../constants.js";
import { init, parse } from "es-module-lexer";
import path from "path";
import resolve from "resolve";
import fs from "fs-extra";
import { normalizePath } from "../util.js";
import { createRequire } from "module";


const require = createRequire(import.meta.url);

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
        const { path: id, importer } = resolveInfo;
        const isEntry = !importer;
        // 裸模块解析为fs绝对路径
        const fspath = normalizePath(
          resolve.sync(id, { basedir: process.cwd() })
        );
        return isEntry
          ? {
              path: id,
              namespace: "dep",
            }
          : {
              path: fspath,
            };
      });

      build.onLoad({ filter: /.*/, namespace: "dep" }, async (moduleInfo) => {
        const id = moduleInfo.path;
        const fspath = normalizePath(
          resolve.sync(id, { basedir: process.cwd() })
        );

        const content = await fs.readFile(fspath, "utf-8");

        const [imports, exports] = parse(content);

        let proxyModule;
        if (!imports.length && !exports.length) {
          // cjs
          const mod = require(fspath);
          const keys = Object.keys(mod);
          if (mod._esModule && mod.default) {
            const excludeDefault = keys.filter((v) => v !== "default");
            proxyModule = `export { ${excludeDefault.join(",")} } from "${fspath}"
            export default require("${fspath}").default
            `;
          } else {
            proxyModule = `export default require("${fspath}")
            export { ${keys.join(",")} } from "${fspath}"
            `;
          }
          const loader = path.extname(fspath).slice(1);
          return {
            loader: loader,
            contents: proxyModule,
            resolveDir: process.cwd(),
          };
        }
      });
    },
  };
}
