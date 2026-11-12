import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FStorefrontHighlights from "@Content/Features/Store/Storefront/FStorefrontHighlights";
import ASEventHandler from "@Content/Modules/Events/ASEventHandler";
import FStorefrontEarlyAccess from "@Content/Features/Store/Storefront/FStorefrontEarlyAccess";

export default class CStoreFront extends Context {

    readonly moreContentEvent: ASEventHandler<void> = new ASEventHandler();

    constructor(params: ContextParams) {
        super(params);
        this.#observeMoreContent();
    }

    #observeMoreContent(): void {
        const moreNode = document.querySelector("#content_more");
        if (!moreNode) {
            console.error("Didn't find #content_more node");
            return;
        }

        const observer = new MutationObserver(() => {
            this.moreContentEvent.dispatch();
        });
        observer.observe(moreNode, {
            childList: true,
            subtree: true
        });
    }
}


/**
 * @contentScript
 * @match *://store.steampowered.com/[?*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CStoreFront(params);

    await features(context, [
        ...commonFeatures(),
        FStorefrontHighlights,
        FStorefrontEarlyAccess,
    ]);
}