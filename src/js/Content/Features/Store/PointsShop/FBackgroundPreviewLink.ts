import self_ from "./FBackgroundPreviewLink.svelte";
import type CPointsShop from "@Content/Features/Store/PointsShop/CPointsShop";
import Feature from "@Content/Modules/Context/Feature";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";
import {mount} from "svelte";
import SelectorMap from "@Content/SelectorMap";
import {MountTargetError} from "@Core/Errors/Errors";

/*
 * Also need to test when viewing the item directly, e.g.
 * https://store.steampowered.com/points/shop/c/backgrounds/reward/150370/
 * https://store.steampowered.com/points/shop/app/3527290/reward/434237
 * https://store.steampowered.com/points/shop/app/3527290/reward/408004
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

        if (!modalEl) {
            throw new MountTargetError();
        }

        this.#addButton(modalEl);

        (new MutationObserver(() => this.#addButton(modalEl)))
            .observe(modalEl!, {
                childList: true,
                subtree: true
            });

        return null;
    }

    #addButton(modalEl: HTMLElement): void {
        if (modalEl.querySelector("#as-preview-bg")) {
            // already mounted
            return;
        }

        const bgLinkSource = modalEl.querySelector<HTMLSourceElement>("video source")?.src
            ?? modalEl.querySelector<HTMLElement>(SelectorMap.store.pointsShop.profileBgImagePreview)?.style.backgroundImage;
        if (!bgLinkSource) {
            console.warn("Failed to find profile bg source");
            return;
        }

        const bgLink = bgLinkSource.match(/images\/items\/(\d+\/[a-z0-9.]+)/i);
        if (!bgLink || !bgLink[1]) {
            console.warn("Failed to parse profile bg source");
            return;
        }

        const target = modalEl.querySelector(SelectorMap.store.pointsShop.profileBgActions);
        if (!target) {
            console.warn("Failed to find profile bg actions");
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
    }
}
