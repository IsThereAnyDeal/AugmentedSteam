(function() {
    // Recalculate offsets for each watcher
    CScrollOffsetWatcher.sm_rgWatchers.forEach(watcher => { watcher.Recalc(); });

    // CScrollOffsetWatcher.OnScroll() expects watchers to be sorted by offset trigger
    CScrollOffsetWatcher.sm_rgWatchers.sort((a, b) => a.nOffsetTopTrigger - b.nOffsetTopTrigger);

    // Start loading images that meet their thresholds immediately
    CScrollOffsetWatcher.OnScroll();
})();
