import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import {__familySharingNotice_desc, __familySharingNotice_notice} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";

export default class FFamilySharingNotice extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.exfgls) { return false; }

        const result = await this.context.data;
        return result !== null && result.family_sharing;
    }

    override apply(): void {
        HTML.beforeBegin("#game_area_purchase",
            `<div>
                <div class="notice_box_top"></div>
                    <div class="notice_box_content"><b>${L(__familySharingNotice_notice)}</b> ${L(__familySharingNotice_desc)}</div>
                <div class="notice_box_bottom"></div>
            </div>`);
    }
}
