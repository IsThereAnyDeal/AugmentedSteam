import {__anotherStore, __coll_inCollection, __ownedElsewhere} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";

export default class FOwnedElsewhere extends Feature {

    checkPrerequisites() {
        return !this.context.isOwned && Background.action("itad.isconnected");
    }

    async apply() {
        const response = await Background.action("itad.getfromcollection", this.context.storeid);
        if (!response) { return; }

        HTML.afterEnd(".queue_overflow_ctn",
            `<div class="game_area_already_owned page_content" style="background-image: linear-gradient(to right, #856d0e 0%, #d1a906 100%);">
                <div class="ds_owned_flag ds_flag" style="background-color: #856d0e;">${L(__coll_inCollection).toUpperCase()}&nbsp;&nbsp;</div>
                <div class="already_in_library" style="color: #ffe000;">
                    ${L(__ownedElsewhere, {
                        "gametitle": this.context.appName,
                        "storelist": L(__anotherStore)
                    })}
                </div>
            </div>`);
    }
}
