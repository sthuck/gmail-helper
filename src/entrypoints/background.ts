export default defineBackground(() => {
  // InboxSDK's bundled background prefers sender.documentId. Firefox's
  // scripting.executeScript long rejected documentIds, so the stock handler
  // reports success and then fails to inject pageWorld.js. Always target the
  // sending frame instead.
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== "inboxsdk__injectPageWorld" || sender.tab?.id == null) {
      return;
    }

    if (!browser.scripting?.executeScript) {
      return false;
    }

    return browser.scripting
      .executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [sender.frameId ?? 0],
        },
        world: "MAIN",
        files: ["pageWorld.js"],
      })
      .then(() => true)
      .catch((err) => {
        console.error("Failed to inject InboxSDK pageWorld.js", err);
        return false;
      });
  });
});
