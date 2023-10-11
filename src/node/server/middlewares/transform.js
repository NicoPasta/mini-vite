// 用于JS请求的转译

import {
  cleanUrl,
  isJSRequest,
  isCSSRequest,
  isImportRequest,
} from "../../util.js";

export const transformRequest = async (url, serverContext) => {
  const { pluginContainer, moduleGraph } = serverContext;

  // 路径解析
  const resolvedId = await pluginContainer.resolveId(url);

  //模块依赖图从入口开始构建
  let module = await moduleGraph.getModuleByUrl(url);
  if (module && module.transformResult) {
    return module.transformResult;
  }

  let transformResult;
  if (resolvedId?.id) {
    // 代码加载
    let code = await pluginContainer.load(resolvedId.id);
    if (typeof code === "object" && code !== null) {
      code = code.code;
    }

    //构建对应的入口模块
    module = await moduleGraph.ensureEntryFromUrl(url);

    if (code) {
      // 代码转译
      transformResult = await pluginContainer.transform(code, resolvedId?.id);
    }

    module.transformResult = transformResult;
  }

  return transformResult;
};

export const transformMiddleware = (serverContext) => {
  return async (req, res, next) => {
    const url = req?.url;
    if (req.method !== "GET" || !url) {
      return next();
    }

    if (isJSRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
      let result = await transformRequest(url, serverContext);

      if (!result) {
        return next();
      }
      if (result && typeof result !== "string") {
        result = result.code;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript");
      return res.end(result);
    }

    return next();
  };
};
