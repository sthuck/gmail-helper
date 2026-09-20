const BUTTON_ATTRIBUTE = 'data-gmail-find-sender-button';
const LABEL = 'Find all emails from sender';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
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

function applyHostStyles(host: HTMLElement, kind: 'message' | 'toolbar') {
  const styles: Array<[string, string]> = [
    ['display', 'inline-flex'],
    ['align-items', 'center'],
    ['justify-content', 'center'],
    ['box-sizing', 'border-box'],
    ['width', 'auto'],
    ['height', kind === 'toolbar' ? '36px' : '32px'],
    ['min-width', '36px'],
    ['min-height', '32px'],
    ['margin', kind === 'toolbar' ? '0 8px' : '0 6px'],
    ['padding', '0'],
    ['border', '0'],
    ['visibility', 'visible'],
    ['opacity', '1'],
    ['overflow', 'visible'],
    ['position', 'relative'],
    ['z-index', '8'],
    ['pointer-events', 'auto'],
    ['vertical-align', 'middle'],
    ['flex', '0 0 auto'],
  ];
  for (const [property, value] of styles) {
    host.style.setProperty(property, value, 'important');
  }
}

function createButton(kind: 'message' | 'toolbar', getEmails: () => string[]): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute(BUTTON_ATTRIBUTE, kind);
  host.setAttribute('aria-label', LABEL);
  host.title = LABEL;
  applyHostStyles(host, kind);

  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { display: inline-flex !important; }
      button {
        align-items: center;
        background: #e8f0fe;
        border: 1px solid #d2e3fc;
        border-radius: 18px;
        color: #1a73e8;
        cursor: pointer;
        display: inline-flex;
        font: 500 13px/1.2 "Google Sans", Roboto, Arial, sans-serif;
        gap: 6px;
        height: 28px;
        margin: 0;
        min-height: 28px;
        min-width: auto;
        padding: 0 10px;
        white-space: nowrap;
      }
      button:hover, button:focus-visible {
        background: #d2e3fc;
        outline: none;
      }
      svg { display: block; flex: 0 0 auto; }
    </style>
    <button type="button" title="${LABEL}">
      ${ICON_SVG}
      <span>From sender</span>
    </button>
  `;

  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    searchEmailsFromSenders(getEmails());
  };
  root.querySelector('button')?.addEventListener('click', activate);
  host.addEventListener('click', activate);
  return host;
}

function getMessageContainers(): HTMLElement[] {
  const found = new Set<HTMLElement>();
  const selectors = [
    '[data-legacy-message-id]',
    '[data-message-id]',
    '[data-legacy-thread-id][data-legacy-message-id]',
  ];
  for (const selector of selectors) {
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      if (element.querySelector('[email], [data-hovercard-id]')) {
        found.add(element);
      }
    }
  }
  if (found.size === 0) {
    for (const sender of document.querySelectorAll<HTMLElement>('[email], span.gD')) {
      if (!getEmail(sender)) continue;
      const container =
        sender.closest<HTMLElement>('[data-legacy-message-id], [data-message-id], .adn, [role="listitem"]') ??
        sender.parentElement;
      if (container) found.add(container);
    }
  }
  return [...found];
}

function mountMessageButtons() {
  for (const message of getMessageContainers()) {
    if (message.querySelector(`[${BUTTON_ATTRIBUTE}="message"]`)) continue;
    const email = getEmail(message);
    if (!email) continue;

    const sender =
      message.querySelector<HTMLElement>('[email], [data-hovercard-id], span.gD, span.zF') ??
      message;
    const button = createButton('message', () => {
      const next = getEmail(message);
      return next ? [next] : [];
    });
    sender.insertAdjacentElement('afterend', button);
  }
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
  return rect.width > 0 && rect.height > 0;
}

function getSelectionMount(): HTMLElement | null {
  const toolbar = [...document.querySelectorAll<HTMLElement>('[gh="tm"], [role="toolbar"]')].find(isVisible);
  if (toolbar) return toolbar;

  const row = getSelectedRows().find(isVisible);
  if (!row) return null;
  return row.querySelector<HTMLElement>('[name], .yW, td') ?? row;
}

function syncSelectionButton() {
  const existing = [...document.querySelectorAll<HTMLElement>(`[${BUTTON_ATTRIBUTE}="toolbar"]`)];
  const senders = getSelectedSenderEmails();
  const mount = getSelectionMount();

  if (!mount || senders.length === 0) {
    existing.forEach((button) => button.remove());
    return;
  }

  const button = existing.shift() ?? createButton('toolbar', getSelectedSenderEmails);
  existing.forEach((duplicate) => duplicate.remove());
  applyHostStyles(button, 'toolbar');
  if (button.parentElement !== mount) mount.append(button);
}

function startObserver() {
  const root = document.body ?? document.documentElement;
  let syncQueued = false;
  const sync = () => {
    syncQueued = false;
    mountMessageButtons();
    syncSelectionButton();
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
