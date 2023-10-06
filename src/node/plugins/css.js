import fs from "fs-extra";

export const cssPlugin = () => {
  return {
    name: "m-vite:css-plugin",
    async load(id) {
      if (id.endsWith(".css")) {
        return fs.readFile(id, "utf-8");
      }
    },

    // 动态插入CSS
    async transform(code, id) {
      if (id.endsWith(".css")) {
        code = `${code.replace(/\n/g, "")}`;
        const jsWrapper = `
        const style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.innerHTML = "${code}";
        document.head.appendChild(style);
        export default "${code}"`.trim();
        return {
          code: jsWrapper,
        };
      }
    },
  };
};
