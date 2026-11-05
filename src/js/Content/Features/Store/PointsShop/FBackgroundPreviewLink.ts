import self_ from "./FBackgroundPreviewLink.svelte";
import type CPointsShop from "@Content/Features/Store/PointsShop/CPointsShop";
import Feature from "@Content/Modules/Context/Feature";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";
import {mount} from "svelte";
import SelectorMap from "@Content/SelectorMap";

/*
 * Also need to test when viewing the item directly, e.g.
 * https://store.steampowered.com/points/shop/c/backgrounds/reward/150370/
 */
export default class FBackgroundPreviewLink extends Feature<CPointsShop> {

    public override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return this.context.user.isSignedIn;
    }

    public override async apply(): Promise<string|null> {

        const modalEl = await dynamicNode({
            selector: () => document.querySelector<HTMLElement>(".FullModalOverlay")
        });

        new MutationObserver(() => {
            if (modalEl.querySelector("#as-preview-bg")) {
                // already mounted
                return;
            }

            const bgLinkSource = modalEl.querySelector<HTMLSourceElement>("video source")?.src
                ?? modalEl.querySelector<HTMLElement>(SelectorMap.store.pointsShop.profileBgImagePreview)?.style.backgroundImage;
            if (!bgLinkSource) {
                console.info("Failed to find profile bg source");
                return;
            }

            const bgLink = bgLinkSource.match(/images\/items\/(\d+\/[a-z0-9.]+)/i);
            if (!bgLink || !bgLink[1]) {
                console.info("Failed to parse profile bg source");
                return;
            }

            const target = modalEl.querySelector(SelectorMap.store.pointsShop.profileBgActions);
            if (!target) {
                return;
            }

            mount(self_, {
                target,
                anchor: target.firstElementChild!,
                props: {
                    user: this.context.user,
                    bg: bgLink[1]
                }
            });
        }).observe(modalEl!, {"childList": true, "subtree": true});

        return null;
    }
}
