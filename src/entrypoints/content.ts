import { startObserver } from '../lib/gmail/observer';

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
