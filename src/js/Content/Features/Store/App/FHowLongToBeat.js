import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FHowLongToBeat extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showhltb")
            || this.context.isDlcLike
            || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.hltb || !result.hltb.success) {
            return false;
        }

        this._data = result.hltb;
        return true;
    }

    apply() {

        const {
            "main_story": story,
            "main_extras": extras,
            comp,
            url,
            "submit_url": submit,
        } = this._data;

        HTML.afterEnd("div.game_details",
            `<div class="block responsive_apppage_details_right heading">${Localization.str.hltb.title}</div>
            <div class="block underlined_links es_hltb">
                <div class="block_content">
                    <div class="block_content_inner">
                        <div class="details_block">
                            ${story ? `<b>${Localization.str.hltb.main}:</b><span>${HTML.escape(story)}</span><br>` : ""}
                            ${extras ? `<b>${Localization.str.hltb.main_e}:</b><span>${HTML.escape(extras)}</span><br>` : ""}
                            ${comp ? `<b>${Localization.str.hltb.compl}:</b><span>${HTML.escape(comp)}</span><br>` : ""}
                        </div>
                        <br>
                        <a class="linkbar es_external_icon" href="${HTML.escape(url)}" target="_blank">${Localization.str.more_information}</a>
                        <a class="linkbar es_external_icon" href="${HTML.escape(submit)}" target="_blank">${Localization.str.hltb.submit}</a>
                    </div>
                </div>
            </div>`);
    }
}
