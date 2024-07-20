import Feature from "@Content/Modules/Context/Feature";
import StringUtils from "@Core/Utils/StringUtils";
import AppLinks from "@Content/Features/Store/Common/ExtraLinks/AppLinks.svelte";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FExtraLinksApp extends Feature<CApp> {

    // Even if the user disabled extra links, the position of the share/embed links is changed
    override apply(): void {

        const target = document.querySelector("#shareEmbedRow");
        if (!target) {
            throw new Error("Node not found");
        }

        // Move share/embed links to the top of the right column
        const sideDetails = document.querySelector(".es_side_details_wrap");
        if (sideDetails) {
            sideDetails.insertAdjacentElement("afterend", target);
        } else {
            document.querySelector("div.rightcol.game_meta_data")!.insertAdjacentElement("afterbegin", target);
        }

        (new AppLinks({
            target,
            anchor: target.firstElementChild!,
            props: {
                appid: this.context.appid,
                communityAppid: this.context.communityAppid,
                appName: StringUtils.clearSpecialSymbols(this.context.appName)
            }
        }));
    }
}
