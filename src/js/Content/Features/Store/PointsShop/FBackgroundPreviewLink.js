import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FBackgroundPreviewLink extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        new MutationObserver(async mutations => {
            for (const {addedNodes} of mutations) {
                if (addedNodes.length !== 1 || !addedNodes[0].classList.contains("active")) { continue; }

                const previewEl = await new Promise(resolve => {
                    new MutationObserver((mutations, observer) => {
                        observer.disconnect();
                        resolve(mutations[0]
                            .addedNodes[0]
                            .querySelector("[class*=redeempointsmodal_PreviewBackgroundContainer]")
                            ?.lastElementChild);
                    }).observe(addedNodes[0], {"childList": true, "subtree": true});
                });

                if (!previewEl) { continue; }

                let bgLink = (previewEl instanceof HTMLVideoElement)
                    ? previewEl.querySelector("source").src // Use the first source (usually webm format, should be well supported)
                    : previewEl.style.backgroundImage;

                bgLink = bgLink.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);

                if (bgLink) {
                    HTML.beforeBegin(addedNodes[0].querySelector("[class*=redeempointsmodal_BackgroundPreviewContainer]"),
                        `<div class="as_preview_background_ctn">
                            <a class="as_preview_background" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                                ${Localization.str.preview_background}
                            </a>
                        </div>`);
                }
            }
        }).observe(document.querySelector(".FullModalOverlay"), {"childList": true});
    }
}
