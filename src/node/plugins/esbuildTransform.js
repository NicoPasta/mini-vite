import * as esbuild from "esbuild";
import { isJSRequest } from "../util.js";
import path from "path";
import fs from "fs-extra";

export const esbuildTransfromPlugin = () => {
  let serverContext;
  return {
    name: "m-vite:esbuildTransfrom",
    configServer(s) {
      serverContext = s;
    },
    async load(id) {
      // 在处理JS的插件里只有JS请求返回文件
      if (isJSRequest(id)) {
        try {
          const code = await fs.readFile(id, "utf-8");
          return code;
        } catch (e) {
          return null;
        }
      }
    },
    async transform(code, id) {
      if (id.startsWith(serverContext.publicDir)) return;
      if (isJSRequest(id)) {
        const extname = path.extname(id).slice(1);
        const { code: transformedCode, map } = await esbuild.transform(code, {
          target: "esnext",
          format: "esm",
          sourcemap: true,
          loader: extname,
        });
        return {
          code: transformedCode,
          map,
        };
      }

      return null;
    },
  };
};
