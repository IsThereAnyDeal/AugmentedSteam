(function() {
    $J(document).ajaxSuccess((event, xhr, settings) => {
        if (/\/(friends|groups)(\/common)?\/?\?ajax=1$/.test(settings.url)) {
            document.dispatchEvent(new CustomEvent("as_subpageNav"));
        }
    });
})();
