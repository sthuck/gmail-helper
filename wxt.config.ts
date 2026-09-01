import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  // InboxSDK injects pageWorld.js via chrome.scripting.executeScript({ world: "MAIN" }).
  // WXT defaults Firefox to MV2, which cannot do that injection reliably.
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    permissions: ["scripting"],
    host_permissions: ["https://mail.google.com/*"],
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "gmail-find-sender@sthuck.info",
              // world: "MAIN" for scripting.executeScript landed in Firefox 128
              strict_min_version: "128.0",
            },
          },
        }
      : {}),
  }),
  hooks: {
    "build:manifestGenerated"(_wxt, manifest) {
      const gecko = manifest.browser_specific_settings?.gecko;
      if (gecko) {
        Object.assign(gecko, {
          data_collection_permissions: { required: ["none"] },
        });
      }
    },
  },
});
