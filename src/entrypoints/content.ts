import InboxSDK, {
  type InboxSDK as InboxSDKInstance,
  type ThreadView,
} from '@inboxsdk/core';
import userIcon from '../assets/user.svg';

function extractSenderEmail(fromHeader: string): string {
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  return emailMatch?.[1] ?? fromHeader.trim();
}

function searchEmailsFromSenders(
  sdk: InboxSDKInstance,
  senderEmails: Array<string>,
) {
  const uniqueEmails = [...new Set(senderEmails.filter(Boolean))];
  if (uniqueEmails.length === 0) return;

  const searchQuery = uniqueEmails.map((email) => `from:${email}`).join(' OR ');
  sdk.Router.goto(
    sdk.Router.createLink(sdk.Router.NativeRouteIDs.SEARCH, {
      query: searchQuery,
    }),
  );
}

export default defineContentScript({
  matches: ['*://mail.google.com/*'],
  main() {
    InboxSDK.load(2, 'sdk_gmailByContact_b147f3dfc5').then((sdk) => {
      sdk.Toolbars.registerThreadButton({
        title: 'Find all emails from sender',
        iconUrl: userIcon,
        onClick(event) {
          if (event.position === 'THREAD') {
            const senderEmails = event.selectedThreadViews
              .map(extractFirstSender)
              .filter((email): email is string => email !== null);
            searchEmailsFromSenders(sdk, senderEmails);
          } else {
            const senderEmails = event.selectedThreadRowViews
              .map((thread) => thread.getContacts()[0]?.emailAddress)
              .filter((email): email is string => Boolean(email));
            searchEmailsFromSenders(sdk, senderEmails);
          }
        },
      });
    }).catch((error: unknown) => {
      console.error('Failed to load InboxSDK:', error);
    });
  },
});

function extractFirstSender(thread: ThreadView): string | null {
  const messages = thread.getMessageViews();
  const firstMessage = messages[0];
  return firstMessage
    ? extractSenderEmail(firstMessage.getSender().emailAddress)
    : null;
}

