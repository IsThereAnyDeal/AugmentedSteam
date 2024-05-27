import self_ from "./FDLCInfo.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";

export default class FDLCInfo extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return this.context.isDlc;
    }

    override async apply(): Promise<void> {
        let response;

        try {
            response = await AugmentedSteamApiFacade.fetchDlcInfo(this.context.appid);
            // TODO remove when suggestion link is fixed
            if (!response || !response.length) { return; }
        } catch (err) {
            console.error(err);
            return;
        }

        const anchor = document.querySelector("#category_block")!;
        const target = anchor.parentElement!;

        (new self_({
            target,
            anchor,
            props: {
                dlcInfo: response
            }
        }));
    }
}
