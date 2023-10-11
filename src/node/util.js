import os from "os";
import path from "path";
import {
  HASH_RE,
  QEURY_RE,
  JS_TYPES_RE,
  CLIENT_PUBLIC_PATH,
} from "./constants.js";

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

// 静态资源请求
export const isImportRequest = (url) => url.endsWith("?import");

// 获取devserver绝对路径
export const devServerPath = (fspath, root) =>
  fspath.startsWith(root + "/")
    ? "/" + path.posix.relative(root, fspath)
    : fspath;

// 去掉import
export const removeImportQuery = (id) => id.replace("?import", "");

// 去掉时间戳
const timestampRE = /\b\?t=\d{13}&?\b/;
export function removeTimestampQuery(url) {
  return url.replace(timestampRE, "");
}

// 运行时脚本
export const isInternalRequest = (url) => url === CLIENT_PUBLIC_PATH;
