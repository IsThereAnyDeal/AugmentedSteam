import Feature from "@Content/Modules/Context/Feature";
import AppLinks from "@Content/Features/Store/Common/ExtraLinks/AppLinks.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import {mount} from "svelte";
import CommunityHubButton from "@Content/Features/Store/Common/ExtraLinks/CommunityHubButton.svelte";
import {MountTargetError} from "@Core/Errors/Errors";

/**
 * See: https://store.steampowered.com/app/102810/Gatling_Gears/?cc=fr
 */
export default class FExtraLinksAppError extends Feature<CApp> {

    public override async isEnabled(): Promise<boolean> {
        // FIXME settings?
        return true;
    }

    override async apply(): Promise<string|null> {
        const header = document.querySelector("h2.pageheader")!;
        if (!header) {
            throw new MountTargetError();
        }

        mount(CommunityHubButton, {
            target: header.parentElement!,
            anchor: header,
            props: {
                appid: this.context.appid
            }
        });

        const hasExtraLinks = Settings.showitadlinks
            || Settings.showsteamdb
            || Settings.showsteamcardexchange
            || Settings.showprotondb
            || Settings.showcompletionistme
            || Settings.showpcgw
            || Settings.app_custom_link.some(link => link.enabled);

        if (hasExtraLinks) {
            mount(AppLinks, {
                target: document.querySelector("#error_box")!,
                props: {
                    appid: this.context.appid,
                    communityAppid: this.context.appid,
                    appPage: false
                }
            });
        }
        return null;
    }
}
