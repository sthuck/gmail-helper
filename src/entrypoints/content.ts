import InboxSDK from '@inboxsdk/core';
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

function searchEmailsFromSender(sdk: any, senderEmail: string) {
  const searchQuery = `from:${senderEmail}`;
  console.log('Searching for emails from:', senderEmail);
  
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
      console.log('InboxSDK loaded successfully');
      sdk.Toolbars.registerThreadButton({
        title: 'Find all emails from sender',
        iconUrl: userIcon,
        onClick: function(event) {
          console.log('event', event);
        }
      })
      // Add button to thread list view when threads are selected
      sdk.Lists.registerThreadRowViewHandler(function(threadRowView) {
        threadRowView.addButton({
          title: 'Find all emails from sender',
          iconUrl: userIcon,
          hasDropdown: false,
          onClick: function(event: any) {
            const thread = threadRowView.getThreadView();
            const messages = thread.getMessageViews();
            if (messages.length > 0) {
              const fromHeader = messages[0].getSender().emailAddress;
              const senderEmail = extractSenderEmail(fromHeader);
              searchEmailsFromSender(sdk, senderEmail);
            }
          },
        });
      });
      
      // Add button to conversation view (inside individual emails)
      sdk.Conversations.registerThreadViewHandler(function(threadView) {
        threadView.addSubjectButton({
          title: 'Find all emails from sender',
          iconUrl: userIcon,
          onClick: function(event) {
            const messageViews = threadView.getMessageViews();
            if (messageViews.length > 0) {
              // Use the first message to get sender info
              const firstMessage = messageViews[0];
              const fromHeader = firstMessage.getSender().emailAddress;
              const senderEmail = extractSenderEmail(fromHeader);
              searchEmailsFromSender(sdk, senderEmail);
            }
          },
        });
      });
      
      // Add button to individual message views within conversations
      sdk.Conversations.registerMessageViewHandler(function(messageView) {
        messageView.addToolbarButton({
          section: 'MORE',
          title: 'Find all emails from this sender',
          iconUrl: userIcon,
          onClick: function(event) {
            const fromHeader = messageView.getSender().emailAddress;
            const senderEmail = extractSenderEmail(fromHeader);
            searchEmailsFromSender(sdk, senderEmail);
          },
        });
      });
      
    }).catch(function(err) {
      console.error('Failed to load InboxSDK:', err);
    });
  },
});
