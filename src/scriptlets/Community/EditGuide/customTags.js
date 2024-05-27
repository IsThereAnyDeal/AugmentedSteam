(function() {
    const params = JSON.parse(document.currentScript.dataset.params);
    const {customTags, enterTag} = params;

    $J("#es_add_tag").on("click", () => {
        const modal = window.showConfirmDialog(customTags,
            `<div class="commentthread_entry_quotebox">
                <textarea placeholder="${enterTag}" class="commentthread_textarea es_tag" rows="1"></textarea>
            </div>`
        );

        const elem = $J(".es_tag");
        let tag = elem.val();

        function done() {
            if (tag.trim().length === 0) {
                return;
            }
            tag = tag[0].toUpperCase() + tag.slice(1);

            document.dispatchEvent(new CustomEvent("as_addTag", {detail: tag}));
        }

        elem.on("keydown paste input", e => {
            tag = elem.val();
            if (e.key === "Enter") {
                modal.Dismiss();
                done();
            }
        });

        modal.done(done);
    });
})();
