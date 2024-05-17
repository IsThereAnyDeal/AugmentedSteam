import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";

export default class FHighlightsTags extends Feature<CApp> {

    async apply(): Promise<void> {
        await DynamicStore.onReady();
        await Promise.all([
            HighlightsTagsUtils.highlightTitle(this.context.appid!),
            HighlightsTagsUtils.highlightAndTag(),
        ]);
    }

}
