import { ASSSETS_EXTENSION } from "../constants.js";
import { cleanUrl, normalizePath, removeImportQuery } from "../util.js";
import fs from "fs-extra";
import path from "path";

export const assetsPlugin = () => {
  let serverContext;
  return {
    name: "m-vite:assets-plugin",
    configServer(s) {
      serverContext = s;
    },
    async resolveId(id) {
      // 检查public文件夹有没有对应文件并加载
      const file = checkPublicDir(id, serverContext);
      if (file) {
        return { id: normalizePath(file) };
      }

      // 处理?import请求,返回服务器根目录绝对路径
      if (id.endsWith("?import")) {
        const resolvedId = path.join(serverContext.root, id);
        return {
          id: resolvedId.slice(serverContext.root.length),
          // url: resolvedId.slice(serverContext.root.length),
        };
      }
    },
    async load(id, importer) {
      // 静态资源或者public文件下的文件，返回路径
      if (id.endsWith("?import") || id.startsWith(serverContext.publicDir)) {
        // 去掉?import
        const cleanedId = removeImportQuery(cleanUrl(id));

        return `export default \`${cleanedId}\` `;
      }
    },
  };
};

export const checkPublicDir = (id, { publicDir, root }) => {
  if (!id.startsWith("/")) {
    return;
  }

  const publicFile = path.join(publicDir, id);

  if (fs.existsSync(publicFile)) {
    return publicFile;
  }
};
