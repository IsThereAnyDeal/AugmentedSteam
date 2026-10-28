import self_ from "./FVaporLensInsights.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import VaporLensApiFacade from "@Content/Facades/VaporLensApiFacade";
import Settings from "@Options/Data/Settings";
import type {TVaporLensResponse,} from "@Background/Modules/VaporLens/_types";
import {mount} from "svelte";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";
import SelectorMap from "@Content/SelectorMap";

export default class FVaporLensInsights extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.ai_enabled && Settings.show_vaporlens_summary;
    }

    override async apply(): Promise<void> {
        let data: TVaporLensResponse|null;
        try {
            data = await VaporLensApiFacade.fetchInsights(this.context.appid);
        } catch (e) {
            this.logError(e, "Failed to fetch VaporLens insights");
            throw new Error("Failed to fetch VaporLens insights");
        }

        if (data === null) {
            throw new Error("No Vaporlens data");
        }

        const summaries = await dynamicNode({
            selector: () => document.querySelector<HTMLElement>(SelectorMap.store.app.reviewSummary),
            observable: document
        });

        mount(self_, {
            target: summaries.parentElement!,
            anchor: summaries.nextElementSibling!,
            props: {
                appid: this.context.appid,
                data
            },
        });
    }
}
