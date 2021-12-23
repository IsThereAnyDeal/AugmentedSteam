import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";

export default class FFamilySharingNotice extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("exfgls")) { return false; }

        const result = await this.context.data;
        return result && result.exfgls && result.exfgls.excluded;
    }

    apply() {
        HTML.beforeBegin("#game_area_purchase",
            `<div>
                <div class="notice_box_top"></div>
                    <div class="notice_box_content">${Localization.str.family_sharing_notice}</div>
                <div class="notice_box_bottom"></div>
            </div>`);
    }
}
