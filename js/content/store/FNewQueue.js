class FNewQueue extends ASFeature {
    checkPrerequisites() {
        return document.querySelector(".finish_queue_text");
    }

    apply() {
        HTML.afterEnd(".btn_next_in_queue",
            `<div id="es_new_queue" class="btn_next_in_queue btn_next_in_queue_trigger" data-tooltip-text="${Localization.str.queue.new_tooltip}">
                <div class="next_in_queue_content">
                    <span class="finish_queue_text">${Localization.str.queue.new}</span>
                </div>
            </div>`);

        ExtensionLayer.runInPageContext(() => {

            $J("#es_new_queue").v_tooltip({"tooltipClass": "store_tooltip", "dataName": 'tooltipText', "defaultType": "text", "replaceExisting": false });

            $J("#es_new_queue").on("click", () => {
                $J.ajax({
                    url: "https://store.steampowered.com/explore/next/" + g_eDiscoveryQueueType + '/',
                    type: "POST",
                    data: $J("#next_in_queue_form").serialize(),
                    success: () => window.location.href = "https://store.steampowered.com/explore/startnew/" + g_eDiscoveryQueueType + '/'
                    // TODO error handling, waiting on #231 and #275 to merge
                });
            });
        });
    }
}