import picocolors from "picocolors";
import { devServerPath } from "./util.js";
const { blue, green } = picocolors;

export const bindingHMREvents = (serverContext) => {
  const { watcher, ws, root, moduleGraph } = serverContext;

  watcher.on("change", async (file) => {
    console.log(`${blue("[hmr]")} ${green(devServerPath(file, root))} changed`);
    // 清除模块依赖图中的缓存
    await moduleGraph.onFileChange(file);
    // 向客户端发送更新信息
    ws.send({
      type: "update",
      updates: [
        {
          type: "js-update",
          timestamp: Date.now(),
          path: devServerPath(file, root),
          acceptedPath: devServerPath(file, root),
        },
      ],
    });
  });
};
