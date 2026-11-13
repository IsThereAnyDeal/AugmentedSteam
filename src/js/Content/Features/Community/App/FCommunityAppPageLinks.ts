import self_ from "./FCommunityAppPageLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import {mount} from "svelte";
import Settings from "@Options/Data/Settings";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FCommunityAppPageLinks extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return Settings.showitadlinks || Settings.showsteamdb;
    }

    override async apply(): Promise<string|null> {
        if (this.context.appid === null) {
            return "Appid not found";
        }

        const node = document.querySelector(".apphub_OtherSiteInfo");
        if (!node) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: node,
            props: {
                appid: this.context.appid!
            },
        });
        return null;
    }
}
