export default defineBackground(() => {
  // background.js
  import('@inboxsdk/core/background.js').then(() => {
    console.log('loaded inboxsdk');
  })
});
