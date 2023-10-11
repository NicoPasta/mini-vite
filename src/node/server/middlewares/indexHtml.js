import path from "path";
import fs from "fs-extra";

export const indexHtmlMiddleware = (serverContext) => {
  return async (req, res, next) => {
    if (req.url === "/") {
      const { root } = serverContext;
      const htmlPath = path.resolve(root, "index.html");

      if (fs.pathExistsSync(htmlPath)) {
        const rawHtml = fs.readFileSync(htmlPath, "utf-8");

        let html = rawHtml;
        // 类似于transform
        for (let plugin of serverContext.plugins) {
          if (plugin.transformIndexHtml) {
            html = plugin.transformIndexHtml(html);
          }
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        return res.end(html);
      }

      return next();
    }
    return next();
  };
};
