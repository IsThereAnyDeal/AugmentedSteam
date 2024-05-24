(function(){
    $J("#es_new_queue").v_tooltip({
        tooltipClass: "store_tooltip",
        dataAttr: "data-tooltip-text",
        defaultType: "text",
        replaceExisting: true
    });

    $J("#es_new_queue").on("click", () => {
        const queueType = window.g_eDiscoveryQueueType;
        $J.ajax({
            "url": `https://store.steampowered.com/explore/next/${queueType}/`,
            "type": "POST",
            "data": $J("#next_in_queue_form").serialize(),
            "success": () => {
                window.location.href = `https://store.steampowered.com/explore/startnew/${queueType}/`;
            }
            // TODO error handling, waiting on #231 and #275 to merge
        });
    });
})();
