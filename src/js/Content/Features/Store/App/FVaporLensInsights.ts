import self_ from "./FVaporLensInsights.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import VaporLensApiFacade from "@Content/Modules/Facades/VaporLensApiFacade";
import Settings from "@Options/Data/Settings";
import type {TVaporLensResponse,} from "@Background/Modules/VaporLens/_types";

export default class FVaporLensInsights extends Feature<CApp> {

    private data: TVaporLensResponse | null = null;

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.ai_enabled || !Settings.show_vaporlens_summary) {
            return false;
        }

        try {
            this.data = await VaporLensApiFacade.fetchInsights(
                this.context.appid
            );

            return this.data !== null;
        } catch (error) {
            this.logError(error, "Failed to fetch VaporLens insights");
            return false;
        }
    }

    override apply(): void {
        if (this.#attach()) {
            return;
        }

        const observer = new MutationObserver(() => {
            if (this.#attach()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    #attach(): boolean {
        const selector = "._2pLm-6qnTQoI2Ir1Btg_id";
        const summaries = document.querySelector(selector);
        if (!summaries) {
            return false;
        }

        new self_({
            target: summaries.parentElement!,
            anchor: summaries.nextElementSibling!,
            props: {
                appid: this.context.appid,
                data: this.data!
            },
        });
        return true;
    }
}
