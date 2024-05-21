import Feature from "@Content/Modules/Context/Feature";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";
import type CStoreBase from "@Content/Features/Store/Common/CStoreBase";

export default class FHighlightsTags extends Feature<CStoreBase> {

    async apply(): Promise<void> {
        await DynamicStore.onReady();
        await Promise.all([
            HighlightsTagsUtils.highlightTitle(this.context.appid!),
            HighlightsTagsUtils.highlightAndTag(),
        ]);
    }

}
