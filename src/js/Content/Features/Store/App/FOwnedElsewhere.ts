import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import HTML from "@Core/Html/Html";
import {__anotherStore, __coll_inCollection, __ownedElsewhere} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";

export default class FOwnedElsewhere extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return !this.context.isOwned && await ITADApiFacade.isConnected();
    }

    override async apply(): Promise<void> {
        const response = await ITADApiFacade.getFromCollection(this.context.storeid);
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
