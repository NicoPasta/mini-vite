import path from "path";

export const EXTERNAL_TYPES = [
  "css",
  "less",
  "sass",
  "scss",
  "stylus",
  "pcss",
  "postcss",
  "vue",
  "svelte",
  "png",
  "jpe?g",
  "gif",
  "svg",
  "webp",
];

export const SUPPORTED_FILE_TYPE = [".js", ".ts", ".jsx", ".tsx"];

// 模拟vite的缓存文件夹
export const PRE_BUNDLE_DIR = path.join("node_modules", ".m-vite");

//
export const BARE_IMPORT_RE = /^[\w@][^:]/;
// JS请求
export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
// 问号开头
export const QEURY_RE = /\?.*$/s;
// 哈希开头
export const HASH_RE = /#.*$/s;

// 静态资源ext
export const ASSSETS_EXTENSION = /\.(png|svg|ico|jpg)$/;

// publicDir
export const MVITE_PUBLIC_DIR = "/public";

// 热更新端口
export const HMR_PORT = 3001;

// 客户端运行时
export const CLIENT_PUBLIC_PATH = "/@m-vite/client";

