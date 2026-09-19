import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    permissions: ["scripting"],
    host_permissions: ["https://mail.google.com/*"],
    web_accessible_resources: [
      {
        resources: ["pageWorld.js"],
        matches: ["https://mail.google.com/*"],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: "gmail-find-sender-emails@sthuck.github",
        strict_min_version: "128.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
