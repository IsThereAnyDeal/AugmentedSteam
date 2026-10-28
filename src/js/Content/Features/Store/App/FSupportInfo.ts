import self_ from "./FSupportInfo.svelte";
import AppId from "@Core/GameId/AppId";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import LocalStorage from "@Core/Storage/LocalStorage";
import SteamStoreApiFacade from "@Content/Facades/SteamStoreApiFacade";
import type {TAppDetail} from "@Background/Modules/Store/_types";
import {mount} from "svelte";

/**
 * Add Support links to the game info area (top right box next to media)
 * Adds support Email, support URL where available, and generic Steam get help link
 */
export default class FSupportInfo extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.showsupportinfo;
    }

    override async apply(): Promise<void> {
        let cached = (await LocalStorage.get("support_info")) ?? null;

        // todo IDB
        if (!cached || !cached.expiry || cached.expiry < Date.now()) {
            cached = {
                data: {},
                expiry: Date.now() + (31 * 86400 * 1000) // 31 days
            };
        }

        // Attempt to get appid of parent app first for DLCs and Soundtracks
        const appid = AppId.fromElement(document.querySelector(".glance_details a")) || this.context.appid;
        let supportInfo = cached.data[appid];

        if (!supportInfo) {
            const response: TAppDetail|null = await SteamStoreApiFacade.fetchAppDetails(appid, "support_info");
            if (!response) {
                throw new Error("Failed to retrieve support info");
            }

            supportInfo = response.support_info;

            cached.data[appid] = supportInfo;
            LocalStorage.set("support_info", cached);
        }

        if (!supportInfo.url && !supportInfo.email) {
            throw new Error("No support info found");
        }

        const target = document.querySelector(".glance_ctn_responsive_left");
        if (!target) {
            throw new Error("Node not found");
        }

        mount(self_, {
            target,
            props: {
                appid: this.context.appid,
                url: supportInfo.url,
                email: supportInfo.email
            }
        });
    }
}
