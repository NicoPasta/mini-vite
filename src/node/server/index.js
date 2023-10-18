import connect from "connect";
import pkg from "picocolors";
import path from "path";
import { optimize } from "../optimizer/index.js";
import { resolvePlugins } from "../plugins/resolvePlugins.js";
import { createPluginContainer } from "../plugins/pluginContainer.js";
import { indexHtmlMiddleware } from "./middlewares/indexHtml.js";
import { transformMiddleware } from "./middlewares/transform.js";
import {
  servePublicMiddleware,
  serveStaticMiddleware,
} from "./middlewares/static.js";
import chokidar from "chokidar";
import { MVITE_PUBLIC_DIR } from "../constants.js";
import { ModuleGraph } from "../moduleGraph.js";
import { createWebSocketServer } from "../ws.js";
import { bindingHMREvents } from "../hmr.js";

const { green, blue } = pkg;

export async function startDevServer() {
  const app = connect();
  const root = process.cwd();
  const startTime = Date.now();

  const ws = createWebSocketServer();
  const watcher = chokidar.watch(root, {
    ignored: ["**/node_modules/**", "**/.git/**"],
    ignoreInitial: true,
  });

  const plugins = resolvePlugins();
  const pluginContainer = createPluginContainer(plugins);
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url));

  // public
  const publicDir = path.join(root, MVITE_PUBLIC_DIR);
  const serverContext = {
    app,
    root,
    plugins,
    pluginContainer,
    publicDir,
    serverPublicDir: MVITE_PUBLIC_DIR,
    moduleGraph,
    ws,
    watcher,
  };
  bindingHMREvents(serverContext);

  // 开发模式下configServer钩子
  for (const plugin of plugins) {
    if (plugin.configServer) {
      await plugin.configServer(serverContext);
    }
  }

  // 处理html
  app.use(indexHtmlMiddleware(serverContext));
  // 处理JS
  app.use(transformMiddleware(serverContext));

  // public文件夹
  app.use(servePublicMiddleware(serverContext.publicDir));

  // root文件夹
  app.use(serveStaticMiddleware(serverContext.root));

  app.listen(3000, async () => {
    await optimize(root, serverContext);
    console.log(
      green("🚀 No-Bundle 服务已经成功启动!"),
      `耗时: ${Date.now() - startTime}ms`
    );
    console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
  });
}
