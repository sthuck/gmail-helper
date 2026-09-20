import { applyHostStyles, createToolbarIcon } from './button';
import { BUTTON_ATTRIBUTE } from './constants';
import { getOpenMessageSenders, getSelectedRows, getSelectedSenderEmails } from './senders';

export function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

export function getToolbarRoot(): HTMLElement | null {
  if (getSelectedRows().length > 0) {
    return [...document.querySelectorAll<HTMLElement>('[gh="tm"]')].find((toolbar) => {
      return isVisible(toolbar) && toolbar.querySelector('[role="button"]');
    }) ?? null;
  }

  const messageToolbar = document.querySelector<HTMLElement>('[gh="mtb"]');
  if (messageToolbar && isVisible(messageToolbar)) return messageToolbar;

  return [...document.querySelectorAll<HTMLElement>('[gh="tm"]')].find((toolbar) => {
    return isVisible(toolbar) && toolbar.querySelector('[role="button"]');
  }) ?? null;
}

export function getToolbarSenders(): string[] {
  const selected = getSelectedSenderEmails();
  if (selected.length > 0) return selected;
  if (document.querySelector('[gh="mtb"]')) return getOpenMessageSenders();
  return [];
}

export function placeToolbarButton(root: HTMLElement, button: HTMLElement) {
  if (root.getAttribute('gh') === 'mtb' || root.classList.contains('iH')) {
    const lastGroup = [...root.querySelectorAll<HTMLElement>('.G-Ni')].filter(isVisible).at(-1);
    if (lastGroup) {
      lastGroup.after(button);
      return;
    }
  }

  const cluster = [...root.querySelectorAll<HTMLElement>('.G-tF')].find(isVisible);
  if (cluster?.parentElement) {
    cluster.parentElement.prepend(button);
    return;
  }

  root.prepend(button);
}

export function syncToolbarButton() {
  document.querySelectorAll(`[${BUTTON_ATTRIBUTE}="message"]`).forEach((legacy) => legacy.remove());

  const existing = [...document.querySelectorAll<HTMLElement>(`[${BUTTON_ATTRIBUTE}="toolbar"]`)];
  const senders = getToolbarSenders();
  const root = getToolbarRoot();

  if (!root || senders.length === 0) {
    existing.forEach((button) => button.remove());
    return;
  }

  const button = existing.shift() ?? createToolbarIcon(getToolbarSenders);
  existing.forEach((duplicate) => duplicate.remove());
  applyHostStyles(button);
  if (!root.contains(button) || !isVisible(button)) {
    placeToolbarButton(root, button);
    applyHostStyles(button);
  }
}
