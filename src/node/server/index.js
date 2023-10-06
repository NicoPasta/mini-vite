import connect from "connect";
import pkg from "picocolors";
import { optimize } from "../optimizer/index.js";
import { resolvePlugins } from "../plugins/resolvePlugins.js";
import { createPluginContainer } from "../plugins/pluginContainer.js";
import { indexHtmlMiddleware } from "./middlewares/indexHtml.js";
import { transformMiddleware } from "./middlewares/transform.js";

const { green, blue } = pkg;

export async function startDevServer() {
  const app = connect();
  const root = process.cwd();
  const startTime = Date.now();

  const plugins = resolvePlugins();
  const serverContext = {
    app,
    root,
    plugins,
    pluginContainer: createPluginContainer(plugins),
  };

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

  app.listen(3000, async () => {
    await optimize(root);
    console.log(
      green("🚀 No-Bundle 服务已经成功启动!"),
      `耗时: ${Date.now() - startTime}ms`
    );
    console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
  });
}
