import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import {__communityHub} from "@Strings/_strings";
import AppLinks from "@Content/Features/Store/Common/ExtraLinks/AppLinks.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";

/**
 * See: https://store.steampowered.com/app/102810/Gatling_Gears/?cc=fr
 */
export default class FExtraLinksAppError extends Feature<CApp> {

    override apply(): void {

        // Add a Community Hub button to roughly where it normally is
        HTML.beforeBegin("h2.pageheader",
            `<div class="es_apphub_OtherSiteInfo">
                <a class="btnv6_blue_hoverfade btn_medium" href="//steamcommunity.com/app/${this.context.appid}/">
                    <span>${L(__communityHub)}</span>
                </a>
            </div>`);

        const hasExtraLinks =  Settings.showitadlinks
            || Settings.showsteamdb
            || Settings.showbartervg
            || Settings.showsteamcardexchange
            || Settings.showprotondb
            || Settings.showcompletionistme
            || Settings.showpcgw
            || Settings.app_custom_link.some(link => link.enabled);

        if (!hasExtraLinks) {
            return;
        }

        (new AppLinks({
            target: document.querySelector("#error_box")!,
            props: {
                appid: this.context.appid,
                communityAppid: this.context.appid,
                appPage: false
            }
        }));
    }
}
