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
        if (!result || !result.hltb) {
            return false;
        }

        this._data = result.hltb;
        return true;
    }

    apply() {

        const {story, extras, complete, url} = this._data;

        function hrs(minutes) {
            return Localization.str.hours_short.replace("__hours__", (minutes / 60).toFixed(1).toString());
        }

        HTML.afterEnd("div.game_details",
            `<div class="block responsive_apppage_details_right heading">${Localization.str.hltb.title}</div>
            <div class="block underlined_links es_hltb">
                <div class="block_content">
                    <div class="block_content_inner">
                        ${story || extras || complete ? `<div class="details_block">
                            ${story ? `<b>${Localization.str.hltb.main}:</b><span>${hrs(story)}</span><br>` : ""}
                            ${extras ? `<b>${Localization.str.hltb.main_e}:</b><span>${hrs(extras)}</span><br>` : ""}
                            ${complete ? `<b>${Localization.str.hltb.compl}:</b><span>${hrs(complete)}</span><br>` : ""}
                        </div>
                        <br>` : ""}
                        <a class="linkbar es_external_icon" href="${HTML.escape(url)}" target="_blank">${Localization.str.more_information}</a>
                    </div>
                </div>
            </div>`);
    }
}
