import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import LocalStorage from "@Core/Storage/LocalStorage";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FSaveReviewFilters extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return !document.querySelector("#noReviewsWriteOne");
    }

    override async apply(): Promise<void> {

        document.addEventListener("filtersChanged", async () => {
            const context = document.querySelector<HTMLInputElement>("#review_context")!.value;
            const language = document.querySelector<HTMLInputElement>("input[name=review_language]:checked")!.id;
            const minPlaytime = document.querySelector<HTMLInputElement>("#app_reviews_playtime_range_min")?.value;
            const maxPlaytime = document.querySelector<HTMLInputElement>("#app_reviews_playtime_range_max")?.value;

            const value: Record<string, string> = (await LocalStorage.get("review_filters")) ?? {};
            value.context = context;
            value.language = language;
            if (minPlaytime) { value.minPlaytime = minPlaytime; }
            if (maxPlaytime) { value.maxPlaytime = maxPlaytime; }

            // @ts-ignore
            LocalStorage.set("review_filters", value);
        });

        DOMHelper.insertScript("scriptlets/Store/App/saveReviewFilters.js",
            (await LocalStorage.get("review_filters")) ?? {}
        );
    }
}
