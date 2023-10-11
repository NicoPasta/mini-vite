// 需要引入的依赖
import path from "path";
import * as esbuild from "esbuild";
import pkg from "picocolors";
import { scanPlugin } from "./scanPlugin.js";
import { PRE_BUNDLE_DIR, SUPPORTED_FILE_TYPE } from "../constants.js";
import { preBundlePlugin } from "./preBundlePlugin.js";
import resolve from "resolve";

import fs from "fs-extra";

const { green } = pkg;

export async function optimize(root, ctx) {
  let entry = "";
  for (let type of SUPPORTED_FILE_TYPE) {
    const res = path.resolve(root, `src/main${type}`);
    if (fs.pathExistsSync(res)) {
      entry = res;
      break;
    }
  }
  if (!entry) {
    throw new Error("no entry found in current working directory");
  }

  // 裸模块id => 绝对路径
  let deps = new Set();
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    // 利用esbuild的打包能力遍历入口模块
    write: false,
    plugins: [scanPlugin(deps, ctx)],
  });

  const res = await esbuild.build({
    entryPoints: [...deps],
    bundle: true,
    // 利用esbuild的打包能力遍历入口模块
    write: true,
    // .mini-vite文件夹
    format: "esm",
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin()],
  });

  console.log(
    `${green("需要预构建的依赖")}:\n${[...deps]
      .map(green)
      .map((item) => `  ${item}`)
      .join("\n")}`
  );
}
