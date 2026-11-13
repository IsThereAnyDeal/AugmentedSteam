import self_ from "./FCommunityAppPageWishlist.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import Settings from "@Options/Data/Settings";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FCommunityAppPageWishlist extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return Settings.wlbuttoncommunityapp;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.user.isSignedIn) {
            return "Must be logged in";
        }

        const appid = this.context.appid;
        if (!appid) {
            return "No appid found";
        }

        const {owned, wishlisted} = await DynamicStore.getAppStatus(`app/${appid}`);
        if (owned) {
            return "Already owned";
        }

        const target = document.querySelector(".apphub_OtherSiteInfo");
        if (!target) {
            throw new MountTargetError();
        }

        mount(self_, {
            target,
            props: {appid, wishlisted}
        });
        return null;
    }
}
