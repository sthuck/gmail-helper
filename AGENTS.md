# AGENTS.md

Guidance for agents working in this repository.

## What this extension does

`gmail-find-sender-emails` restores Gmail’s old “find all mail from this sender” action.

It injects one toolbar icon on `mail.google.com`:

- Open thread: icon in Gmail’s message action row (`[gh="mtb"]`), after Archive/Delete/More
- Selected inbox rows: icon on the list action toolbar (`[gh="tm"]`)
- Click navigates with Gmail’s own hash search: `#search/from:address` or `#search/from:"Name"`

There is no InboxSDK, popup, or background/service-worker script. Chrome and Firefox both use the same content-script DOM integration.

## Development commands

WXT 0.21 + Svelte + TypeScript. Node 26, pnpm 12 (`packageManager` in `package.json`), and Vite as a WXT peer:

- `pnpm install` — install and run `wxt prepare`
- `pnpm dev` / `pnpm dev:firefox` — development
- `pnpm build` / `pnpm build:firefox` — production builds (`.output/chrome-mv3`, `.output/firefox-mv2`)
- `pnpm zip` / `pnpm zip:firefox` — store zip
- `pnpm check` — `svelte-check` (needs `.wxt/` from `wxt prepare` or a build)

CI (`.github/workflows/ci.yml`) runs `pnpm check` plus Chrome and Firefox builds on pull requests and pushes to `main`.

A published GitHub release tagged `vX.Y.Z` runs `.github/workflows/release.yml`: it writes `X.Y.Z` into `package.json` (and commits that to the release target branch), then uploads `gmail-find-sender-emails-X.Y.Z-chrome.zip` and `...-firefox.zip` to the release.

Load unpacked from `.output/chrome-mv3` or as a Firefox temporary add-on from `.output/firefox-mv2/manifest.json`. After load, grant site access for `mail.google.com` or the content script will not run.

## Layout

- `src/entrypoints/content.ts` — WXT content-script entry (`*://mail.google.com/*`, `document_idle`)
- `src/lib/gmail/observer.ts` — MutationObserver / hashchange / click sync for Gmail’s SPA
- `src/lib/gmail/toolbar.ts` — find the action toolbar, place and remount the icon
- `src/lib/gmail/button.ts` — icon host, shadow DOM, style lock against Gmail CSS
- `src/lib/gmail/senders.ts` — sender email/name extraction and search navigation
- `src/lib/gmail/constants.ts` — shared selectors, label, icon SVG factory
- `wxt.config.ts` — `host_permissions: https://mail.google.com/*`; Firefox `gecko` id and `data_collection_permissions`
- `.cursor/environment.json` — Cloud Agent install (`pnpm install --frozen-lockfile`)

Template leftovers (`src/lib/Counter.svelte`, default icons) are unused by the Gmail feature.

## Gmail DOM notes

Gmail markup is an unstable integration boundary. Keep selectors and mount logic in `src/lib/gmail/`.

Stable-enough anchors:

- List/selection toolbar: `[gh="tm"]`, inner action cluster `.G-tF`
- Open-thread toolbar: `[gh="mtb"]` (often `div.iH.bzn`)
- Inbox rows: `tr[role="row"]` / `[data-legacy-thread-id]`, selection via `[role="checkbox"][aria-checked="true"]`
- Open messages: `[data-legacy-message-id]` or `[data-message-id]`
- Sender: `[email]`, `[data-hovercard-id]`, or `name` on the sender span

Do not match English `aria-label` / tooltip strings. Gmail localizes them.

## Implementation constraints

- Shared web APIs only. No Chrome-only extension APIs.
- Do not use InboxSDK. Firefox support is required.
- Do not impersonate Gmail’s `G-Ni` / `T-I` button classes for the host. Gmail’s toolbar controller hides or removes unknown native-looking children (`display: none` or delete).
- Gmail also zeros native `<button>` dimensions in some contexts. The icon lives in shadow DOM with inline `!important` host styles, and a small observer re-applies those styles if Gmail mutates them.
- List-toolbar rebuilds on selection change. `syncToolbarButton()` remounts when the icon is missing or not visible. Persistence in `.G-tF` is still the fragile part.
- Inbox list rows often have `email=""`. Prefer a real address when present; otherwise search `from:"Display Name"`.
- Search with `window.location.hash = '#search/' + encodeURIComponent(query)`.

## Verification

Exercise both surfaces in Chrome and Firefox:

1. Open a thread, confirm the icon in the Archive/Delete/More row, click, confirm `#search/from:...`
2. Inbox: select a row, confirm the icon on the selection action bar, click, confirm the same kind of search
3. Leave the inbox with no selection

Do not send, delete, archive, or label mail while testing.