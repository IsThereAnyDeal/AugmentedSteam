import {L} from "@Core/Localization/Localization";
import {__previewBackground} from "@Strings/_strings";
import type CPointsShop from "@Content/Features/Store/PointsShop/CPointsShop";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";

export default class FBackgroundPreviewLink extends Feature<CPointsShop> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn;
    }

    override async apply(): Promise<void> {

        let modalEl = document.querySelector<HTMLElement>(".FullModalOverlay");
        if (!modalEl) {
            await new Promise<void>(resolve => {
                new MutationObserver((_, observer) => {
                    modalEl = document.querySelector(".FullModalOverlay");
                    if (modalEl) {
                        observer.disconnect();
                        resolve();
                    }
                }).observe(document.body, {"childList": true});
            });
        }

        /*
         * Also need to test hen viewing the item directly, e.g.
         * https://store.steampowered.com/points/shop/c/backgrounds/reward/150370/
         */
        new MutationObserver(mutations => {
            let container;
            outer: for (const mutation of mutations) {
                const addedNodes = mutation.addedNodes as NodeListOf<HTMLElement>;
                for (const node of addedNodes) {
                    if (node.classList.contains("ModalPosition")) {
                        container = node;
                        break outer;
                    }
                }
            }
            if (!container) { return; }

            let previewEl: HTMLElement|null = null;
            for (const node of container.querySelectorAll("div")) {

                // https://store.cloudflare.steamstatic.com/public/images/applications/store/background_preview.png
                const bg = getComputedStyle(node).backgroundImage;
                if (/\/background_preview\.png/.test(bg)) {
                    previewEl = <HTMLElement|null>(node.nextElementSibling);
                    break;
                }
            }
            if (!previewEl) { return; }

            const bgLinkSource = previewEl.tagName === "VIDEO"
                ? previewEl.querySelector("source")!.src // Use the first source (usually webm format, should be well supported)
                : previewEl.style.backgroundImage;

            const bgLink = bgLinkSource.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);
            if (!bgLink) { return; }

            HTML.beforeBegin(previewEl.parentNode as Element|null,
                `<div class="as_preview_background_ctn">
                    <a class="as_preview_background" target="_blank" href="${this.context.user.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                        ${L(__previewBackground)}
                    </a>
                </div>`);
        }).observe(modalEl!, {"childList": true, "subtree": true});
    }
}
