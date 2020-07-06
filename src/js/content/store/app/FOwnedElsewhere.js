import {ASFeature} from "modules/ASFeature";
import {Background} from "common";
import {HTML} from "core";
import {Localization} from "language";

export class FOwnedElsewhere extends ASFeature {

    async checkPrerequisites() {
        return !this.context.isOwned() && await Background.action("itad.isconnected");
    }

    async apply() {
        const response = await Background.action("itad.getfromcollection", this.context.storeid);
        if (!response) { return; }

        const storeList = response.map(store => `<strong>${store}</strong>`).join(", ");

        HTML.afterEnd(".queue_overflow_ctn",
            `<div class="game_area_already_owned page_content" style="background-image: linear-gradient(to right, #856d0e 0%, #d1a906 100%);">
                <div class="ds_owned_flag ds_flag" style="background-color: #856d0e;">${Localization.str.coll.in_collection.toUpperCase()}&nbsp;&nbsp;</div>
                <div class="already_in_library" style="color: #ffe000;">${Localization.str.owned_elsewhere.replace("__gametitle__", this.context.appName).replace("__storelist__", storeList)}</div>
            </div>`);
    }
}
