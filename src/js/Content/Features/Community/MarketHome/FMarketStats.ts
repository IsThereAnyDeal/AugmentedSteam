import Feature from "@Content/Modules/Context/Feature";
import type CMarketHome from "@Content/Features/Community/MarketHome/CMarketHome";
import MarketStats from "@Content/Features/Community/MarketHome/Components/MarketStats.svelte";
import Settings from "@Options/Data/Settings";
import { mount } from "svelte";

export default class FMarketStats extends Feature<CMarketHome> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn;
    }

    override apply(): void {

        const node = document.querySelector("#findItems");
        if (!node) {
            return;
        }
        const target = node.parentElement!;
        const anchor = node;

        (mount(MarketStats, {
                    target,
                    anchor,
                    props: {
                        loadOnMount: Settings.showmarkettotal
                    }
                }));
    }
}
