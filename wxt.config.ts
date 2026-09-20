import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: ({ browser }) => ({
    host_permissions: ["https://mail.google.com/*"],
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "gmail-find-sender-emails@sthuck.github",
              strict_min_version: "140.0",
              data_collection_permissions: {
                required: ["none"],
              },
            },
            gecko_android: {
              strict_min_version: "142.0",
            },
          },
        }
      : {}),
  }),
});
