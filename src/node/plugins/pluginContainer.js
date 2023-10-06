export const createPluginContainer = (plugins) => {
  // 钩子上下文this
  const createPluginContext = () => {
    return {
      resolve(id, importer) {
        const resolved = pluginContainer.resolveId(id, importer);
        if (typeof resolved === "string") {
          return { id: resolved };
        } else {
          return resolved;
        }
      },
    };
  };

  const pluginContainer = {
    // 有一个钩子有返回值就return
    async resolveId(id, importer) {
      const ctx = createPluginContext();
      for (let plugin of plugins) {
        if (plugin.resolveId) {
          const res = await plugin.resolveId.call(ctx, id, importer);
          if (res) {
            const id = typeof res === "string" ? res : res.id;
            return { id };
          }
        }
      }
    },
    async load(id) {
      // 同理
      const ctx = createPluginContext();
      for (let plugin of plugins) {
        if (plugin.load) {
          const res = await plugin.load.call(ctx, id);
          if (res) {
            return res;
          }
        }
      }
    },
    async transform(code, id) {
      // 依次调用每一个钩子进行处理
      const ctx = createPluginContext();
      for (const plugin of plugins) {
        if (plugin.transform) {
          const result = await plugin.transform.call(ctx, code, id);
          if (!result) continue;
          if (typeof result === "string") {
            code = result;
          } else if (result.code) {
            code = result.code;
          }
        }
      }
      return code ? { code } : null;
    },
  };

  return pluginContainer;
};
