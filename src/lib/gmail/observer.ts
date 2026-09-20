import { syncToolbarButton } from './toolbar';

export function startObserver() {
  const root = document.body ?? document.documentElement;
  let syncQueued = false;
  const sync = () => {
    syncQueued = false;
    syncToolbarButton();
  };
  const scheduleSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(sync);
  };

  new MutationObserver(scheduleSync).observe(root, {
    attributeFilter: ['aria-checked', 'email', 'data-hovercard-id'],
    attributes: true,
    childList: true,
    subtree: true,
  });
  window.addEventListener('hashchange', scheduleSync);
  document.addEventListener('click', scheduleSync, true);
  scheduleSync();
}
