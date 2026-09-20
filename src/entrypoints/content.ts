const BUTTON_ATTRIBUTE = 'data-gmail-find-sender-button';
const LABEL = 'Find all emails from sender';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444746" stroke-width="1.8" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
`;

function isEmail(value: string | null | undefined): boolean {
  return !!value && EMAIL_PATTERN.test(value);
}

function extractEmailFromValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (isEmail(trimmed)) return trimmed;
  const angled = trimmed.match(/<([^>]+)>/);
  if (angled && isEmail(angled[1].trim())) return angled[1].trim();
  const match = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match && isEmail(match[0]) ? match[0] : null;
}

function extractEmailFromElement(element: Element): string | null {
  const preferred = [
    element.getAttribute('email'),
    element.getAttribute('data-hovercard-id'),
    element.getAttribute('data-email'),
    element.getAttribute('name'),
    element.getAttribute('title'),
    element.getAttribute('aria-label'),
    element.getAttribute('data-tooltip'),
  ];
  for (const value of preferred) {
    const email = extractEmailFromValue(value);
    if (email) return email;
  }
  for (const attribute of element.attributes) {
    const email = extractEmailFromValue(attribute.value);
    if (email) return email;
  }
  return extractEmailFromValue(element.textContent);
}

function getEmail(container: ParentNode): string | null {
  const selectors = '[email], [data-hovercard-id], [data-email], span.gD, span.yP, span.zF';
  for (const element of container.querySelectorAll(selectors)) {
    const email = extractEmailFromElement(element);
    if (email) return email;
  }
  if (container instanceof Element) {
    const own = extractEmailFromElement(container);
    if (own) return own;
  }
  for (const element of container.querySelectorAll('*')) {
    const email = extractEmailFromElement(element);
    if (email) return email;
  }
  return null;
}

function getSenderName(container: ParentNode): string | null {
  const named = container.querySelector('[name]');
  const name = named?.getAttribute('name')?.trim();
  if (name && name.toLowerCase() !== 'gmail') return name;
  const text = container.querySelector('.yW, .zF, .gD, .yP')?.textContent?.trim();
  return text || null;
}

function getSenderQueryToken(container: ParentNode): string | null {
  return getEmail(container) ?? getSenderName(container);
}

function searchEmailsFromSenders(senders: string[]) {
  const uniqueSenders = [...new Set(senders.filter(Boolean))];
  if (uniqueSenders.length === 0) return;
  const query = uniqueSenders
    .map((sender) => (isEmail(sender) ? `from:${sender}` : `from:"${sender.replaceAll('"', '')}"`))
    .join(' OR ');
  window.location.hash = `#search/${encodeURIComponent(query)}`;
}

const HOST_STYLES = [
  ['display', 'inline-flex'],
  ['align-items', 'center'],
  ['justify-content', 'center'],
  ['box-sizing', 'border-box'],
  ['width', '40px'],
  ['height', '40px'],
  ['min-width', '40px'],
  ['min-height', '40px'],
  ['margin', '0 4px'],
  ['padding', '0'],
  ['border', '0'],
  ['flex', '0 0 auto'],
  ['visibility', 'visible'],
  ['opacity', '1'],
  ['overflow', 'visible'],
  ['position', 'relative'],
  ['cursor', 'pointer'],
  ['vertical-align', 'middle'],
] as const;

function applyHostStyles(element: HTMLElement) {
  for (const [property, value] of HOST_STYLES) {
    element.style.setProperty(property, value, 'important');
  }
  element.removeAttribute('hidden');
}

function createToolbarIcon(getSenders: () => string[]): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute(BUTTON_ATTRIBUTE, 'toolbar');
  host.setAttribute('role', 'button');
  host.setAttribute('tabindex', '0');
  host.setAttribute('aria-label', LABEL);
  host.setAttribute('data-tooltip', LABEL);
  host.title = LABEL;
  applyHostStyles(host);

  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { display: inline-flex !important; }
      button {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 50%;
        color: #444746;
        cursor: pointer;
        display: inline-flex;
        height: 32px;
        justify-content: center;
        margin: 0;
        padding: 0;
        width: 32px;
      }
      button:hover, button:focus-visible { background: rgba(60, 64, 67, 0.12); outline: none; }
      svg { display: block; width: 20px; height: 20px; }
    </style>
    <button type="button" title="${LABEL}">${ICON_SVG}</button>
  `;

  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    searchEmailsFromSenders(getSenders());
  };
  root.querySelector('button')?.addEventListener('click', activate);
  host.addEventListener('click', activate);
  host.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') activate(event);
  });

  new MutationObserver(() => {
    if (host.hasAttribute('hidden') || host.style.getPropertyValue('display') !== 'inline-flex') {
      applyHostStyles(host);
    }
  }).observe(host, {
    attributeFilter: ['style', 'hidden', 'class'],
    attributes: true,
  });
  return host;
}

function getOpenMessageSenders(): string[] {
  const containers = [
    ...document.querySelectorAll<HTMLElement>('[data-legacy-message-id], [data-message-id]'),
  ];
  const senders = containers
    .map(getSenderQueryToken)
    .filter((sender): sender is string => sender !== null);
  if (senders.length > 0) return [...new Set(senders)];

  const main = document.querySelector('[role="main"]');
  const fallback = main ? getSenderQueryToken(main) : null;
  return fallback ? [fallback] : [];
}

function getSelectedRows(): HTMLElement[] {
  const rows = new Set<HTMLElement>();
  for (const checkbox of document.querySelectorAll('[role="checkbox"][aria-checked="true"]')) {
    const row = checkbox.closest<HTMLElement>(
      '[data-legacy-thread-id], [role="row"], tr, li',
    );
    if (!row || row === document.body) continue;
    if (row.querySelector('[role="columnheader"], [role="heading"]')) continue;
    rows.add(row);
  }
  return [...rows];
}

function getSelectedSenderEmails(): string[] {
  return [...new Set(
    getSelectedRows()
      .map(getSenderQueryToken)
      .filter((sender): sender is string => sender !== null),
  )];
}

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function getToolbarRoot(): HTMLElement | null {
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

function getToolbarSenders(): string[] {
  const selected = getSelectedSenderEmails();
  if (selected.length > 0) return selected;
  if (document.querySelector('[gh="mtb"]')) return getOpenMessageSenders();
  return [];
}

function placeToolbarButton(root: HTMLElement, button: HTMLElement) {
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

function syncToolbarButton() {
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

function startObserver() {
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

export default defineContentScript({
  matches: ['*://mail.google.com/*'],
  runAt: 'document_idle',
  main() {
    if (document.body) {
      startObserver();
      return;
    }
    window.addEventListener('DOMContentLoaded', startObserver, { once: true });
  },
});
