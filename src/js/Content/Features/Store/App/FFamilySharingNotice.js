import {__familySharingNotice_desc, __familySharingNotice_notice} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FFamilySharingNotice extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("exfgls")) { return false; }

        const result = await this.context.data;
        return result && !result.family_sharing;
    }

    apply() {
        HTML.beforeBegin("#game_area_purchase",
            `<div>
                <div class="notice_box_top"></div>
                    <div class="notice_box_content"><b>${L(__familySharingNotice_notice)}</b> ${L(__familySharingNotice_desc)}</div>
                <div class="notice_box_bottom"></div>
            </div>`);
    }
}
