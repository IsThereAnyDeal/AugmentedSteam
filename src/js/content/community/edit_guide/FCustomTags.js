import {Feature} from "modules";

import {HTML, LocalStorage, Localization} from "core";
import {ExtensionLayer, Messenger} from "common";

export default class FCustomTags extends Feature {

    apply() {
        this._addTags();
        this._rememberTags();
    }

    _addTags() {

        const langSection = document.querySelector("#checkboxgroup_1");
        if (!langSection) { return; }

        Messenger.addMessageListener("addtag", name => {
            this._addTag(name, true);
        });

        HTML.afterEnd(langSection,
            `<div class="tag_category_container" id="checkboxgroup_2">
                <div class="tag_category_desc">${Localization.str.custom_tags}</div>
                <div><a style="margin-top: 8px;" class="btn_blue_white_innerfade btn_small_thin" id="es_add_tag">
                    <span>${Localization.str.add_tag}</span>
                </a></div>
            </div>`);

        ExtensionLayer.runInPageContext((customTags, enterTag) => {
            /* eslint-disable no-undef, new-cap */
            $J("#es_add_tag").on("click", () => {
                const Modal = ShowConfirmDialog(customTags,
                    `<div class="commentthread_entry_quotebox">
                        <textarea placeholder="${enterTag}" class="commentthread_textarea es_tag" rows="1"></textarea>
                    </div>`);

                const elem = $J(".es_tag");
                let tag = elem.val();

                function done() {
                    if (tag.trim().length === 0) { return; }
                    tag = tag[0].toUpperCase() + tag.slice(1);
                    window.Messenger.postMessage("addtag", tag);
                }

                elem.on("keydown paste input", e => {
                    tag = elem.val();
                    if (e.key === "Enter") {
                        Modal.Dismiss();
                        done();
                    }
                });

                Modal.done(done);
            });
            /* eslint-enable no-undef, new-cap */
        }, [Localization.str.custom_tags, Localization.str.enter_tag]);
    }

    _rememberTags() {

        const submitBtn = document.querySelector("[href*=SubmitGuide]");
        if (!submitBtn) { return; }

        const params = new URLSearchParams(window.location.search);
        const curId = params.get("id") || "recent";
        const savedTags = LocalStorage.get("es_guide_tags", {});
        if (!savedTags[curId]) {
            savedTags[curId] = savedTags.recent || [];
        }

        for (const id in savedTags) {
            for (const tag of savedTags[id]) {
                const node = document.querySelector(`[name="tags[]"][value="${tag.replace(/"/g, '\\"')}"]`);
                if (node && curId === id) {
                    node.checked = true;
                } else if (!node) {
                    this._addTag(tag, curId === id);
                }
            }
        }

        submitBtn.removeAttribute("href");
        submitBtn.addEventListener("click", () => {
            savedTags.recent = [];
            savedTags[curId] = Array.from(document.querySelectorAll("[name='tags[]']:checked")).map(node => node.value);
            LocalStorage.set("es_guide_tags", savedTags);
            // eslint-disable-next-line no-undef, new-cap
            ExtensionLayer.runInPageContext(() => { SubmitGuide(); });
        });
    }

    _addTag(name, checked = true) {
        const _name = HTML.escape(name);
        const attr = checked ? " checked" : "";
        const tag = `<div><input type="checkbox" name="tags[]" value="${_name}" class="inputTagsFilter"${attr}>${_name}</div>`;
        HTML.beforeBegin("#es_add_tag", tag);
    }
}
