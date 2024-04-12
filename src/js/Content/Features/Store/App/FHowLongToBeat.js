import {
    __hltb_compl,
    __hltb_main,
    __hltb_mainE,
    __hltb_title,
    __hoursShort,
    __moreInformation,
} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML, SyncedStorage} from "../../../../modulesCore";
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
            return L(__hoursShort, {"hours": (minutes / 60).toFixed(1).toString()});
        }

        HTML.afterEnd("div.game_details",
            `<div class="block responsive_apppage_details_right heading">${L(__hltb_title)}</div>
            <div class="block underlined_links es_hltb">
                <div class="block_content">
                    <div class="block_content_inner">
                        ${story || extras || complete ? `<div class="details_block">
                            ${story ? `<b>${L(__hltb_main)}:</b><span>${hrs(story)}</span><br>` : ""}
                            ${extras ? `<b>${L(__hltb_mainE)}:</b><span>${hrs(extras)}</span><br>` : ""}
                            ${complete ? `<b>${L(__hltb_compl)}:</b><span>${hrs(complete)}</span><br>` : ""}
                        </div>
                        <br>` : ""}
                        <a class="linkbar es_external_icon" href="${HTML.escape(url)}" target="_blank">${L(__moreInformation)}</a>
                    </div>
                </div>
            </div>`);
    }
}
