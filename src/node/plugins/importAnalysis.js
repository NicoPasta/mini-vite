import resolve from "resolve";
import path from "path";
import fs from "fs-extra";
import MagicString from "magic-string";
import { isJSRequest, cleanUrl, normalizePath, resolveUrl } from "../util.js";
import {
  BARE_IMPORT_RE,
  SUPPORTED_FILE_TYPE,
  PRE_BUNDLE_DIR,
  ASSSETS_EXTENSION,
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
      // 只处理 JS 相关的请求
      if (!isJSRequest(id)) {
        return null;
      }
      const [imports] = parse(code);
      const ms = new MagicString(code);

      for (const importInfo of imports) {
        const { s: modStart, e: modEnd, n: modSource } = importInfo;
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
        } else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          let resolvedUrl = await resolveUrl(modSource, id, serverContext);

          // 静态资源标记
          if (resolvedUrl.match(ASSSETS_EXTENSION)) {
            resolvedUrl += "?import";
          }

          ms.overwrite(modStart, modEnd, resolvedUrl);
        }
      }

      return {
        code: ms.toString(),
        // 生成 SourceMap
        map: ms.generateMap(),
      };
    },
  };
};
