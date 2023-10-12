import fs from "fs-extra";
import { devServerPath } from "../util.js";
import { CLIENT_PUBLIC_PATH } from "../constants.js";

export const cssPlugin = () => {
  let serverContext;
  return {
    name: "m-vite:css-plugin",
    configServer(s) {
      serverContext = s;
    },
    async load(id) {
      if (id.endsWith(".css")) {
        return fs.readFile(id, "utf-8");
      }
    },

    // 动态插入CSS
    async transform(code, id) {
      if (id.endsWith(".css")) {
        const jsWrapper = `
        import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";
        import.meta.hot = __vite__createHotContext("${devServerPath(
          id,
          serverContext.root
        )}");
        import { updateStyle, removeStyle } from "${CLIENT_PUBLIC_PATH}"
        
        const id = '${id}'
        const css = '${code.replace(/\n/g, "")}';

        // new一个style element，插入到header中,热更新时取出style更新inneHtml
        updateStyle(id,css)
        import.meta.hot.accept()
        // 不再引入时，触发模块销毁回调,暂时未实现相关逻辑
        import.meta.hot.prune(() => removeStyle(id))
        export default css
        
        `.trim();
        return {
          code: jsWrapper,
        };
      }
    },
  };
};
