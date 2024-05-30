import {__addTag, __customTags, __enterTag} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CEditGuide from "@Content/Features/Community/EditGuide/CEditGuide";
import DOMHelper from "@Content/Modules/DOMHelper";
import HTML from "@Core/Html/Html";
import LocalStorage from "@Core/Storage/LocalStorage";

export default class FCustomTags extends Feature<CEditGuide> {

    override apply(): void {
        this._addTags();
        this._rememberTags();
    }

    _addTags(): void {
        const langSection = document.querySelector("#checkboxgroup_1");
        if (!langSection) { return; }

        // @ts-ignore
        document.addEventListener("as_addTag", (e: CustomEvent<string>) => {
            this._addTag(e.detail, true);
        });

        HTML.afterEnd(langSection,
            `<div class="tag_category_container" id="checkboxgroup_2">
                <div class="tag_category_desc">${L(__customTags)}</div>
                <div><a style="margin-top: 8px;" class="btn_blue_white_innerfade btn_small_thin" id="es_add_tag">
                    <span>${L(__addTag)}</span>
                </a></div>
            </div>`);

        DOMHelper.insertScript("scriptlets/Community/EditGuide/customTags.js", {
            customTags: L(__customTags),
            enterTag: L(__enterTag)
        });
    }

    async _rememberTags(): Promise<void> {

        const submitBtn = document.querySelector("[href*=SubmitGuide]");
        if (!submitBtn) { return; }

        const params = new URLSearchParams(window.location.search);
        const curId = params.get("id") ?? "recent";
        const savedTags: Record<string, string[]> = (await LocalStorage.get("es_guide_tags")) ?? {};
        if (!savedTags[curId]) {
            savedTags[curId] = savedTags.recent ?? [];
        }

        for (const [id, tags] of Object.entries(savedTags)) {
            for (const tag of tags) {
                const node = document.querySelector<HTMLInputElement>(`[name="tags[]"][value="${tag.replace(/"/g, '\\"')}"]`);
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
            savedTags[curId] = Array.from(
                document.querySelectorAll<HTMLInputElement>("[name='tags[]']:checked")
            ).map(node => node.value);

            LocalStorage.set("es_guide_tags", savedTags);

            DOMHelper.insertScript("scriptlets/Community/EditGuide/submitGuide.js");
        });
    }

    _addTag(name: string, checked: boolean = true): void {
        const _name = HTML.escape(name);
        const attr = checked ? " checked" : "";
        const tag = `<div><input type="checkbox" name="tags[]" value="${_name}" class="inputTagsFilter"${attr}>${_name}</div>`;
        HTML.beforeBegin("#es_add_tag", tag);
    }
}
