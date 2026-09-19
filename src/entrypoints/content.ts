import userIcon from '../assets/user.svg';

const BUTTON_ATTRIBUTE = 'data-gmail-find-sender-button';
const MESSAGE_SELECTOR = '[data-message-id]';
const ROW_SELECTOR = 'tr[role="row"]';
const TOOLBAR_SELECTOR = '[gh="tm"]';
const LABEL = 'Find all emails from sender';

function getEmail(container: ParentNode): string | null {
  const email = container.querySelector<HTMLElement>('[email]')?.getAttribute('email')?.trim();
  return email && /^[^\s@]+@[^\s@]+$/.test(email) ? email : null;
}

function searchEmailsFromSenders(emails: string[]) {
  const uniqueEmails = [...new Set(emails)];
  if (uniqueEmails.length === 0) return;

  const query = uniqueEmails.map((email) => `from:${email}`).join(' OR ');
  window.location.hash = `#search/${encodeURIComponent(query)}`;
}

function createButton(kind: 'message' | 'toolbar', getEmails: () => string[]): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute(BUTTON_ATTRIBUTE, kind);
  button.setAttribute('aria-label', LABEL);
  button.title = LABEL;
  button.className = `gmail-find-sender-button gmail-find-sender-button--${kind}`;

  const icon = document.createElement('img');
  icon.src = userIcon;
  icon.alt = '';
  button.append(icon);

  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    searchEmailsFromSenders(getEmails());
  };

  button.addEventListener('click', activate);
  return button;
}

function mountMessageButtons() {
  document.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR).forEach((message) => {
    if (message.querySelector(`[${BUTTON_ATTRIBUTE}="message"]`)) return;

    const sender = message.querySelector<HTMLElement>('[email]');
    if (!sender || !getEmail(message)) return;

    sender.insertAdjacentElement(
      'afterend',
      createButton('message', () => {
        const email = getEmail(message);
        return email ? [email] : [];
      }),
    );
  });
}

function getSelectedRows(): HTMLTableRowElement[] {
  return [...document.querySelectorAll<HTMLTableRowElement>(ROW_SELECTOR)].filter((row) => {
    return row.querySelector('[role="checkbox"][aria-checked="true"]') !== null;
  });
}

function getVisibleToolbar(): HTMLElement | null {
  return [...document.querySelectorAll<HTMLElement>(TOOLBAR_SELECTOR)].find((toolbar) => {
    return toolbar.getClientRects().length > 0;
  }) ?? null;
}

function syncSelectionButton() {
  const existingButtons = [...document.querySelectorAll<HTMLButtonElement>(
    `[${BUTTON_ATTRIBUTE}="toolbar"]`,
  )];
  const selectedRows = getSelectedRows();
  const emails = selectedRows.map(getEmail).filter((email): email is string => email !== null);
  const toolbar = getVisibleToolbar();

  if (!toolbar || emails.length === 0) {
    existingButtons.forEach((button) => button.remove());
    return;
  }

  const button = existingButtons.shift() ?? createButton(
    'toolbar',
    () => getSelectedRows().map(getEmail).filter((email): email is string => email !== null),
  );
  existingButtons.forEach((duplicate) => duplicate.remove());
  if (button.parentElement !== toolbar) toolbar.append(button);
}

function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .gmail-find-sender-button {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: 50%;
      box-sizing: border-box;
      color: #444746;
      cursor: pointer;
      display: inline-flex;
      justify-content: center;
      padding: 0;
      vertical-align: middle;
    }

    .gmail-find-sender-button:hover,
    .gmail-find-sender-button:focus-visible {
      background: rgba(60, 64, 67, 0.12);
      outline: none;
    }

    .gmail-find-sender-button img {
      height: 20px;
      width: 20px;
    }

    .gmail-find-sender-button--message {
      height: 28px;
      margin-inline: 4px;
      width: 28px;
    }

    .gmail-find-sender-button--toolbar {
      align-self: center;
      height: 36px;
      margin-inline: 6px;
      width: 36px;
    }
  `;
  document.head.append(style);
}

export default defineContentScript({
  matches: ['*://mail.google.com/*'],
  main() {
    addStyles();

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

    new MutationObserver(scheduleSync).observe(document.body, {
      attributeFilter: ['aria-checked'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener('hashchange', scheduleSync);
    scheduleSync();
  },
});

