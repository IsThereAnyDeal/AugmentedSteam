import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import StringUtils from "@Core/Utils/StringUtils";
import {__communityHub} from "@Strings/_strings";
import AppLinks from "@Content/Features/Store/Common/ExtraLinks/AppLinks.svelte";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FExtraLinksApp extends Feature<CApp> {

    private _node: HTMLElement|null = null;

    override checkPrerequisites(): boolean {

        this._node = document.querySelector<HTMLElement>(
            this.context.isErrorPage
                ? "#error_box"
                : "#shareEmbedRow"
        );

        if (!this._node) {
            console.warn("Couldn't find element to insert extra links");
            return false;
        }

        // Even if the user doesn't want to see any extra links, the position of the share/embed links is changed
        return true;
    }

    apply() {
        const node = this._node!;

        if (this.context.isErrorPage) {

            // Add a Community Hub button to roughly where it normally is
            HTML.beforeBegin("h2.pageheader",
                `<div class="es_apphub_OtherSiteInfo">
                    <a class="btnv6_blue_hoverfade btn_medium" href="//steamcommunity.com/app/${this.context.appid}/">
                        <span>${L(__communityHub)}</span>
                    </a>
                </div>`);
        } else {

            // Move share/embed links to the top of the right column
            const sideDetails = document.querySelector(".es_side_details_wrap");
            if (sideDetails) {
                sideDetails.insertAdjacentElement("afterend", node);
            } else {
                document.querySelector("div.rightcol.game_meta_data")!.insertAdjacentElement("afterbegin", node);
            }
        }

        let target: HTMLElement;
        let anchor: HTMLElement|undefined = undefined;

        if (this.context.isErrorPage) {
            target = document.createElement("div");
            target.classList.add("es_extralinks_ctn");
            node.insertAdjacentElement("afterend", target);
        } else {
            target = node;
            anchor = (node.firstElementChild ?? undefined) as HTMLElement|undefined;
        }

        (new AppLinks({
            target,
            anchor,
            props: {
                appid: this.context.appid,
                communityAppid: this.context.communityAppid,
                appName: StringUtils.clearSpecialSymbols(this.context.appName)
            }
        }));
    }
}
