import { CLIENT_PUBLIC_PATH, HMR_PORT } from "../constants.js";
import fs from "fs-extra";
import path from "path";

export function clientInjectPlugin() {
  let serverContext;
  return {
    name: "m-vite:client-inject",
    configServer(s) {
      serverContext = s;
    },
    resolveId(id) {
      // pathRosolve插件匹配不到这个路径后会走到这里来
      if (id === CLIENT_PUBLIC_PATH) {
        return {
          id,
        };
      }
    },
    async load(id) {
      if (id === CLIENT_PUBLIC_PATH) {
        // const fspath = path.join(
        //   serverContext.root,
        // "node_modules"
        //   "mini-vite",
        //   "dist",
        //   // nobundle运行时需要es模块进行加载
        //   "client.mjs"
        // );
        const fspath = path.join(
          serverContext.root,
          "../src",
          "client",
          "client.js"
        );

        const code = await fs.readFile(fspath, "utf-8");
        return {
          code: code.replace("__HMR_PORT__", HMR_PORT),
        };
      }
    },
    transformIndexHtml(raw) {
      // 插入客户端脚本
      // 即在 head 标签后面加上 <script type="module" src="/@vite/client"></script>
      // 在 indexHtml 中间件里面会执行 transformIndexHtml 钩子
      return raw.replace(
        /(<head[^>]*>)/i,
        // $1是上面匹配到的head开始标签，拼在一起
        `$1<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>`
      );
    },
  };
}
