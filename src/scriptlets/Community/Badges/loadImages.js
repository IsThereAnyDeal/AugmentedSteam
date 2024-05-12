
(function() {
    const params = JSON.parse(document.currentScript.dataset.params);

    window.g_rgDelayedLoadImages = params.images;

    // Clear registered image lazy loader watchers
    CScrollOffsetWatcher.sm_rgWatchers = []; // eslint-disable-line no-undef, camelcase

    // Recreate image lazy loader watchers
    for (const node of document.querySelectorAll("div[id^=image_group_scroll_badge_images_]")) {
        f.loadImageGroupOnScroll(node.id, node.id.slice(19));
    }
})();
