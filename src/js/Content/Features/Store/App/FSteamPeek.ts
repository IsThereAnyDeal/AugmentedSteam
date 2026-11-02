import self_ from "./FSteamPeek.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FSteamPeek extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return Settings.show_steampeek;
    }

    async apply(): Promise<string|null> {
        const moreLikeThis = document.querySelector(".related_items_ctn .page_content");
        if (!moreLikeThis) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: moreLikeThis,
            anchor: moreLikeThis.firstElementChild ?? undefined,
            props: {
                user: this.context.user,
                language: this.context.language?.name ?? "english",
                appid: this.context.appid
            }
        });
        return null;
    }
}
