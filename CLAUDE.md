# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a WXT (Web Extension Toolkit) project with Svelte and TypeScript:

- `pnpm dev` - Start development server
- `pnpm dev:firefox` - Start development for Firefox
- `pnpm build` - Build extension for production
- `pnpm build:firefox` - Build for Firefox specifically
- `pnpm zip` - Create extension zip file
- `pnpm zip:firefox` - Create Firefox extension zip
- `pnpm check` - Run Svelte type checking

## Architecture

This is a browser extension built with WXT framework and Svelte:

**Extension Structure:**
- `src/entrypoints/background.ts` - Service worker/background script
- `src/entrypoints/content.ts` - Content script that runs on Google sites
- `src/entrypoints/popup/` - Extension popup UI built with Svelte

**Key Technologies:**
- WXT for browser extension development
- Svelte 5 for UI components
- TypeScript for type safety
- InboxSDK for Gmail integration
- Uses PNPM as package manager

**Gmail Integration:**
The content script uses InboxSDK to interact with Gmail. It targets `*://mail.google.com/*` and provides:
- Access to Gmail compose views and thread views
- Ability to add custom buttons and UI elements
- Rich API for reading and modifying Gmail content

InboxSDK is loaded with app ID 'gmail-helper-extension' and includes example compose button functionality.