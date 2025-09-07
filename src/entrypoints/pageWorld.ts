export default defineUnlistedScript(() => {
    import('@inboxsdk/core/pageWorld.js').then(() => {
        console.log('loaded inboxsdk page_world');
    })
});