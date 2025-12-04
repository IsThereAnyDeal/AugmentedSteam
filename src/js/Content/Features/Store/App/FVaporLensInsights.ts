import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import VaporLensApiFacade from "@Content/Modules/Facades/VaporLensApiFacade";
import Settings from "@Options/Data/Settings";
import self_ from "./FVaporLensInsights.svelte";
import type {TVaporLensResponse,} from "@Background/Modules/VaporLens/_types";

export default class FVaporLensInsights extends Feature<CApp> {

    private data: TVaporLensResponse | null = null;

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.show_vaporlens_summary) {
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
        const summaries = document.querySelector(".review_score_summaries");
        if (!summaries) {
            return;
        }

        new self_({
            target: summaries.parentElement!,
            anchor: summaries.nextElementSibling!,
            props: {
                formatter: new Intl.NumberFormat(
                    this.context.language?.code ?? document.documentElement.lang ?? navigator.language,
                    {style: "percent", maximumFractionDigits: 0}
                ),
                appid: this.context.appid,
                data: this.data!
            },
        });
    }
}
