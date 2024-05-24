(function(){
    const bcStore = window.uiBroadcastWatchStore;
    if (bcStore && bcStore.m_activeVideo) {
        bcStore.StopVideo(bcStore.m_activeVideo);
    }
})();
