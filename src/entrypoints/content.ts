import InboxSDK, { ButtonDescriptor, ThreadRowView, ThreadView } from '@inboxsdk/core';
import userIcon from '../assets/user.svg';

function extractSenderEmail(fromHeader: string): string {
  // Extract email from "Name <email@domain.com>" format
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  if (emailMatch) {
    return emailMatch[1];
  }
  // If no angle brackets, assume the whole string is the email
  return fromHeader.trim();
}

function searchEmailsFromSender(sdk: any, senderEmail: string | string[]) {
  // Handle both single email and array of emails
  const emails = Array.isArray(senderEmail) ? senderEmail : [senderEmail];
  
  // Remove duplicates and filter out any null/undefined values
  const uniqueEmails = [...new Set(emails.flat().filter(email => email))];
  
  // Construct search query with multiple "from:" clauses joined by OR
  const searchQuery = uniqueEmails.map(email => `from:${email}`).join(' OR ');
  
  // Navigate to search results
  sdk.Router.goto(sdk.Router.createLink(sdk.Router.NativeRouteIDs.SEARCH, {
    query: searchQuery
  }));
}

export default defineContentScript({
  matches: ['*://mail.google.com/*'],
  main() {
    console.log('Gmail helper content script loaded');
    
    InboxSDK.load(2, 'sdk_gmailByContact_b147f3dfc5').then(function(sdk) {
      sdk.Toolbars.registerThreadButton({
        title: 'Find all emails from sender',
        iconUrl: userIcon,
        onClick: function(event) {
          console.log('event', event);
          if (event.position == 'THREAD') {
            const senderEmails = event.selectedThreadViews.flatMap(tv => extractFirstSender(tv)).filter(email => email !== null);
            searchEmailsFromSender(sdk, senderEmails);
          } else if (event.position == 'LIST' || event.position == 'ROW') {
            const senderEmails = event.selectedThreadRowViews.map(trv => {
              const senderEmail = trv.getContacts()[0].emailAddress
              return senderEmail;
            });
            searchEmailsFromSender(sdk, senderEmails);
          }
        }
      })
      
    }).catch(function(err) {
      console.error('Failed to load InboxSDK:', err);
    });
  },
});
function extractFirstSender(thread: InboxSDK.ThreadView): string | null {
  const messages = thread.getMessageViews();
  if (messages.length > 0) {
    const fromHeader = messages[0].getSender().emailAddress;
    const senderEmail = extractSenderEmail(fromHeader);
    return senderEmail;
  }
  return null;
}

