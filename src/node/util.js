import os from "os";
import path from "path";
import { HASH_RE, QEURY_RE, JS_TYPES_RE } from "./constants.js";

// 替换win的反斜杠
export function slash(p) {
  return p.replace(/\\/g, "/");
}

export const isWindows = os.platform() === "win32";

export function normalizePath(id) {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

// 去掉哈希和请求参数
export const cleanUrl = (url) => {
  return url.replace(HASH_RE, "").replace(QEURY_RE, "");
};

// JS请求
export const isJSRequest = (id) => {
  id = cleanUrl(id);
  if (JS_TYPES_RE.test(id)) {
    return true;
  }
  // 没有拓展名,也认为是JS
  if (!path.extname(id) && !id.endsWith("/")) {
    return true;
  }
  return false;
};

// css请求
export const isCSSRequest = (id) => cleanUrl(id).endsWith(".css");

export const resolveUrl = async (id, importer, serverContext) => {
  const resolvedId = await serverContext.pluginContainer.resolveId(
    id,
    importer
  );

  if (resolvedId.id) {
    // 改写成相对于根服务器的绝对路径
    return resolvedId.id.slice(serverContext.root.length);
  }
};
export const isImportRequest = (url) => url.endsWith("?import");

export const removeImportQuery = (id) => id.replace("?import", "");
