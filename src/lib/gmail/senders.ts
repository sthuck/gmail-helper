import { EMAIL_PATTERN } from './constants';

export function isEmail(value: string | null | undefined): boolean {
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

export function getEmail(container: ParentNode): string | null {
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

export function getSenderName(container: ParentNode): string | null {
  const named = container.querySelector('[name]');
  const name = named?.getAttribute('name')?.trim();
  if (name && name.toLowerCase() !== 'gmail') return name;
  const text = container.querySelector('.yW, .zF, .gD, .yP')?.textContent?.trim();
  return text || null;
}

export function getSenderQueryToken(container: ParentNode): string | null {
  return getEmail(container) ?? getSenderName(container);
}

export function searchEmailsFromSenders(senders: string[]) {
  const uniqueSenders = [...new Set(senders.filter(Boolean))];
  if (uniqueSenders.length === 0) return;
  const query = uniqueSenders
    .map((sender) => (isEmail(sender) ? `from:${sender}` : `from:"${sender.replaceAll('"', '')}"`))
    .join(' OR ');
  window.location.hash = `#search/${encodeURIComponent(query)}`;
}

export function getOpenMessageSenders(): string[] {
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

export function getSelectedRows(): HTMLElement[] {
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

export function getSelectedSenderEmails(): string[] {
  return [...new Set(
    getSelectedRows()
      .map(getSenderQueryToken)
      .filter((sender): sender is string => sender !== null),
  )];
}
