import sirv from "sirv";
import { cleanUrl, isImportRequest } from "../../util.js";
import path from "path";

export function servePublicMiddleware(dir) {
  const serve = sirv(dir, { dev: true });

  return function mviteServePublicMiddleware(req, res, next) {
    // ？import请求
    if (isImportRequest(req.url)) {
      return next();
    }
    serve(req, res, next);
  };
}

export function serveStaticMiddleware(dir) {
  const serve = sirv(dir, { dev: true });

  return function mviteServeStaticMiddleware(req, res, next) {
    const cleanedUrl = cleanUrl(req.url);
    // html和import请求不处理
    if (
      cleanedUrl.endsWith("/") ||
      path.extname(cleanedUrl) === ".html" ||
      isImportRequest(req.url)
    ) {
      return next();
    }

    serve(req, res, next);
  };
}
