import path from "path";
import fs from "fs-extra";
import MagicString from "magic-string";
import {
  isJSRequest,
  cleanUrl,
  normalizePath,
  isInternalRequest,
  devServerPath,
} from "../util.js";
import {
  BARE_IMPORT_RE,
  SUPPORTED_FILE_TYPE,
  PRE_BUNDLE_DIR,
  ASSSETS_EXTENSION,
  CLIENT_PUBLIC_PATH,
} from "../constants.js";

import { parse } from "es-module-lexer";

export const importAnalysis = () => {
  let serverContext;
  return {
    name: "m-vite:import-analysis",
    configServer(s) {
      serverContext = s;
    },
    async transform(code, id) {
      if (id.startsWith(serverContext.publicDir)) return;

      // 只处理 JS 相关的请求
      if (!isJSRequest(id) || isInternalRequest(id)) {
        return null;
      }
      const importedModules = new Set();

      const [imports] = parse(code);
      const ms = new MagicString(code);

      for (const importInfo of imports) {
        let { s: modStart, e: modEnd, n: modSource } = importInfo;
        if (!modSource) continue;

        if (BARE_IMPORT_RE.test(modSource)) {
          // 导入语句是裸模块,替换为预构建目录
          // 请求会再次走resoveId
          const preBundlePath = path.join(
            "/",
            PRE_BUNDLE_DIR,
            modSource + ".js"
          );

          ms.overwrite(modStart, modEnd, preBundlePath);
          importedModules.add(preBundlePath);
        } else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          let resolvedUrl = await resolve(modSource, id, serverContext);
          // 静态资源标记
          if (resolvedUrl.match(ASSSETS_EXTENSION)) {
            resolvedUrl += "?import";
            ms.overwrite(modStart, modEnd, resolvedUrl);
            continue;
          }
          ms.overwrite(modStart, modEnd, resolvedUrl);
          importedModules.add(resolvedUrl);
        }
      }

      const { moduleGraph, root } = serverContext;
      const curIdUrl = devServerPath(id, root);
      // devserverpath
      const curMod = moduleGraph.getModuleByUrl(curIdUrl);

      moduleGraph.updateModuleInfo(curMod, importedModules);

      // 只对业务源码注入
      if (!id.includes("node_modules")) {
        // 注入 HMR 相关的工具函数
        ms.prepend(
          `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}"; import.meta.hot = __vite__createHotContext(${JSON.stringify(
            curIdUrl
          )});`
        );
      }

      return {
        code: ms.toString(),
        // 生成 SourceMap
        map: ms.generateMap(),
      };
    },
  };
};

export const resolve = async (id, importer, serverContext) => {
  const { pluginContainer, moduleGraph, root } = serverContext;
  const resolved = await pluginContainer.resolveId(id, normalizePath(importer));

  if (!resolved) return;

  // assets不纳入依赖图
  if (id.match(ASSSETS_EXTENSION)) {
    return resolved.id.slice(root.length);
  }

  // 去掉查询参数后才能去模块依赖图找模块
  let cleanedId = cleanUrl(resolved.id);

  // key为devserver路径
  let devServerCleanedId = cleanedId.slice(root.length);

  const mod = moduleGraph.ensureEntryFromUrl(devServerCleanedId);

  // 每次热更新后重新走编译流程
  if (mod?.lastHMRTimestamp > 0) {
    devServerCleanedId += `?t=${mod.lastHMRTimestamp}`;
  }

  return devServerCleanedId;
};
