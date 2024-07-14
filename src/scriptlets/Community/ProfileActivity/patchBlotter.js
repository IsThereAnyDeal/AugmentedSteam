(function(){
    // Fix undefined function when clicking on the "show all x comments" button under "uploaded a screenshot" type activity
    if (typeof window.Blotter_ShowLargeScreenshot !== "function") {

        window.Blotter_ShowLargeScreenshot = (galleryid, showComments) => {
            const gallery = g_BlotterGalleries[galleryid];
            const ss = gallery.shots[gallery.m_screenshotActive];
            ShowModalContent(`${ss.m_modalContentLink}&insideModal=1&showComments=${showComments}`, ss.m_modalContentLinkText, ss.m_modalContentLink, true);
        };
    }
})();
