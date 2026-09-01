import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const root = resolve(import.meta.dirname, "..");
const outputDir = resolve(root, ".output/firefox-mv3");
const manifestPath = resolve(outputDir, "manifest.json");
const backgroundPath = resolve(outputDir, "background.js");
const pageWorldPath = resolve(outputDir, "pageWorld.js");

assert(existsSync(manifestPath), "Firefox MV3 output is missing. Run pnpm build:firefox first.");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

assert(manifest.manifest_version === 3, "Firefox build must be Manifest V3 for InboxSDK pageWorld injection");
assert(manifest.permissions?.includes("scripting"), "Firefox manifest must request the scripting permission");
assert(
  manifest.host_permissions?.includes("https://mail.google.com/*"),
  "Firefox manifest must include the Gmail host permission",
);
assert(manifest.browser_specific_settings?.gecko?.id, "Firefox MV3 requires a gecko extension id");
assert(
  manifest.browser_specific_settings?.gecko?.data_collection_permissions?.required?.includes("none"),
  "Firefox manifest must declare data collection permissions",
);
assert(
  manifest.background?.scripts?.includes("background.js") ||
    manifest.background?.service_worker === "background.js",
  "Firefox manifest must register the background script",
);

assert(existsSync(backgroundPath), "background.js is missing from the Firefox build");
assert(existsSync(pageWorldPath), "pageWorld.js is missing from the Firefox build");

const background = readFileSync(backgroundPath, "utf8");
assert(background.includes("inboxsdk__injectPageWorld"), "background must handle InboxSDK pageWorld injection");
assert(background.includes("frameIds"), "background must inject into the sending frame");
assert(!background.includes("documentIds"), "background must not use documentIds (unsupported/unreliable in Firefox)");
assert(background.includes('world:"MAIN"') || background.includes("world:\"MAIN\""), "pageWorld must run in the MAIN world");

console.log("Firefox build is valid for InboxSDK.");
