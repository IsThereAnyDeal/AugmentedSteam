import Feature from "@Content/Modules/Context/Feature";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FHighlightTitle extends Feature<CApp> {

    async apply(): Promise<void> {
        await DynamicStore.onReady();
        await HighlightsTagsUtils.highlightTitle(this.context.appid);
    }
}
