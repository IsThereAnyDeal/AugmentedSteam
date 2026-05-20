import Feature from "@Content/Modules/Context/Feature";
import StringUtils from "@Core/Utils/StringUtils";
import AppLinks from "@Content/Features/Store/Common/ExtraLinks/AppLinks.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";

export default class FExtraLinksApp extends Feature<CApp> {

    override checkPrerequisites(): boolean | Promise<boolean> {
        return Settings.showitadlinks
            || Settings.showsteamdb
            || Settings.showbartervg
            || Settings.showsteamcardexchange
            || Settings.showprotondb
            || Settings.showcompletionistme
            || Settings.showpcgw
            || this.context.appName && (
                Settings.showtwitch
                || Settings.showyoutube
                || Settings.showyoutubegameplay
                || Settings.showyoutubereviews
            )
            || Settings.app_custom_link.some(link => link.enabled)
    }

    // Even if the user disabled extra links, the position of the share/embed links is changed
    override apply(): void {
        const target = document.querySelector("div.rightcol.game_meta_data");
        if (!target) {
            throw new Error("Node not found");
        }

        (new AppLinks({
            target,
            anchor: target.firstElementChild ?? undefined,
            props: {
                appid: this.context.appid,
                communityAppid: this.context.communityAppid,
                appName: StringUtils.clearSpecialSymbols(this.context.appName),
                appPage: true
            }
        }));
    }
}
