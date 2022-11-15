import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FBackgroundPreviewLink extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        // Steam has changed things several times already, now this modal element is always present
        const modalEl = document.querySelector(".FullModalOverlay");
        if (!modalEl) { return; }

        /*
         * Also need to test hen viewing the item directly, e.g.
         * https://store.steampowered.com/points/shop/c/backgrounds/reward/150370/
         */
        new MutationObserver(mutations => {
            const container = mutations[0].addedNodes[0];
            if (!container?.classList?.contains("ModalPosition")) { return; }

            const previewEl = container
                .querySelector("[class*=redeempointsmodal_PreviewBackgroundContainer]")
                ?.lastElementChild;

            if (!previewEl) { return; }

            let bgLink = (previewEl instanceof HTMLVideoElement)
                ? previewEl.querySelector("source").src // Use the first source (usually webm format, should be well supported)
                : previewEl.style.backgroundImage;

            bgLink = bgLink.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);

            if (!bgLink) { return; }

            HTML.beforeBegin(container.querySelector("[class*=redeempointsmodal_BackgroundPreviewContainer]"),
                `<div class="as_preview_background_ctn">
                    <a class="as_preview_background" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                        ${Localization.str.preview_background}
                    </a>
                </div>`);
        }).observe(modalEl, {"childList": true, "subtree": true});
    }
}
