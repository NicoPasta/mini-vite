import resolve from "resolve";
import fs from "fs-extra";
import path from "path";
import {
  cleanUrl,
  isJSRequest,
  normalizePath,
  removeTimestampQuery,
} from "../util.js";
import { SUPPORTED_FILE_TYPE } from "../constants.js";

// 负责请求URL到磁盘绝对目录的转换
export const resolvePlugin = () => {
  let serverContext;
  return {
    name: "m-vite:resolvePlugin",
    configServer(c) {
      serverContext = c;
    },
    async resolveId(id, importer) {
      // TODO
      // 考虑绝对路径的ext
      // 绝对路径

      if (id.includes("?t=")) {
        id = removeTimestampQuery(id);
      }

      if (path.isAbsolute(id)) {
        if (id.startsWith(serverContext.root)) {
          // fs绝对路径
          if (await fs.pathExists(id)) return { id: normalizePath(id) };
        }

        // 用id解析fs路径
        let fspath = await tryfsResolve(id, serverContext);
        if (fspath) {
          return { id: normalizePath(fspath) };
        }

        // 相对路径
      } else if (id.startsWith(".")) {
        if (!importer) {
          throw new Error(`${id} has no importer`);
        }

        const hasExtension = !!path.extname(id).length;
        let resolvedId;

        // 有无拓展名
        if (hasExtension) {
          // 根据dirname确定相对路径
          resolvedId = normalizePath(
            resolve.sync(id, { basedir: path.dirname(importer) })
          );
          if (await fs.pathExists(resolvedId)) {
            // const url = resolvedId.slice(serverContext.root.length);
            return {
              id: resolvedId,
              // devserver绝对路径
              // url,
            };
          }
        } else {
          // 挨个试
          for (let ext of SUPPORTED_FILE_TYPE) {
            try {
              const extPath = id + ext;
              resolvedId = normalizePath(
                resolve.sync(extPath, { basedir: path.dirname(importer) })
              );
              if (await fs.pathExists(resolvedId)) {
                // const url = resolvedId.slice(serverContext.root.length);
                return {
                  id: resolvedId,
                  // url,
                };
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      return null;
    },
  };
};

export const tryfsResolve = async (id, serverContext) => {
  const fspath = path.join(serverContext.root, id.slice(1));

  if (await fs.pathExists(fspath)) {
    return fspath;
  }
};
