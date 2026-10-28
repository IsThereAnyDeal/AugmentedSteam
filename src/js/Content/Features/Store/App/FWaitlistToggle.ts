import self_ from "./FWaitlistToggle.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import AppId from "@Core/GameId/AppId";
import {mount} from "svelte";
import ITADApiFacade from "@Content/Facades/ITADApiFacade";
import Settings from "@Options/Data/Settings";

export default class FWaitlistToggle extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.add_to_waitlist
            && document.querySelector("#add_to_wishlist_area") !== null
            && (await ITADApiFacade.isConnected());
    }

    override async apply(): Promise<void> {

        const parent = document.querySelector<HTMLElement>(".queue_actions_ctn");
        if (!parent) {
            return;
        }

        /**
         * Link a demo app's appid to its parent appid.
         * Steam does so when wishlisting, but we'll use the real appid for convenience.
         */
        let appid: number = this.context.appid;
        let storeid: string = this.context.storeid;

        const isDemoApp = document.querySelector("img[src$='/ico_demo.gif']") !== null;
        if (isDemoApp) {
            const communityBtn = document.querySelector<HTMLAnchorElement>("a[href^='https://steamcommunity.com/app/']");
            if (communityBtn) {
                appid = AppId.fromUrl(communityBtn.href)!;
                storeid = `app/${appid}`;
            }
        }

        // queueBtnFollow
        const followButton = parent.querySelector("#queueBtnFollow");
        if (!followButton) {
            return;
        }

        mount(self_, {
            target: parent,
            anchor: followButton,
            props: {
                appid,
                storeid
            }
        })
    }
}
