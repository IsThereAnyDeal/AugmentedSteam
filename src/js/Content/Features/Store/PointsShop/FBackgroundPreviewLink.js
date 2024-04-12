import {L} from "@Core/Localization/Localization";
import {__previewBackground} from "@Strings/_strings";
import {HTML} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FBackgroundPreviewLink extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    async apply() {

        let modalEl = document.querySelector(".FullModalOverlay");
        if (!modalEl) {
            await new Promise(resolve => {
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
            outer: for (const {addedNodes} of mutations) {
                for (const node of addedNodes) {
                    if (node.classList.contains("ModalPosition")) {
                        container = node;
                        break outer;
                    }
                }
            }
            if (!container) { return; }

            let previewEl;
            for (const node of container.querySelectorAll("div")) {

                // https://store.cloudflare.steamstatic.com/public/images/applications/store/background_preview.png
                const bg = getComputedStyle(node).backgroundImage;
                if (/\/background_preview\.png/.test(bg)) {
                    previewEl = node.nextElementSibling;
                    break;
                }
            }
            if (!previewEl) { return; }

            let bgLink = previewEl.tagName === "VIDEO"
                ? previewEl.querySelector("source").src // Use the first source (usually webm format, should be well supported)
                : previewEl.style.backgroundImage;

            bgLink = bgLink.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);

            if (!bgLink) { return; }

            HTML.beforeBegin(previewEl.parentNode,
                `<div class="as_preview_background_ctn">
                    <a class="as_preview_background" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                        ${L(__previewBackground)}
                    </a>
                </div>`);
        }).observe(modalEl, {"childList": true, "subtree": true});
    }
}
