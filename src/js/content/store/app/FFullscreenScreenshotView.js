import { ASFeature } from "../../ASFeature.js";
import { HTML } from "../../../core.js";

export class FFullscreenScreenshotView extends ASFeature {

    apply() {
        function toggleFullScreen(ev) {
            if (!document.fullscreenElement) {
                ev.target.closest(".screenshot_popup_modal_content").requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        function initFSVButtons() {
            let modalFooter = document.querySelector(".screenshot_popup_modal_footer");
            let nextButton = modalFooter.querySelector(".next");
            let nextButtonOffsetWidth = nextButton.offsetWidth;
            if (nextButton.style.display === "none") {
                nextButton.style.display = "";
                nextButtonOffsetWidth = nextButton.offsetWidth;
                nextButton.style.display = "none";
            }
            HTML.beforeEnd(modalFooter,
                `<div class="btnv6_blue_hoverfade btn_medium es_screenshot_fullscreen_toggle" style="right: calc(${nextButtonOffsetWidth}px + 0.5em)"><i></i></div>`);
            let fsvButton = modalFooter.querySelector(".es_screenshot_fullscreen_toggle");
            fsvButton.addEventListener("click", toggleFullScreen);

            let modalTitleLink = modalFooter.parentElement.querySelector(".screenshot_popup_modal_title > a");
            HTML.beforeEnd(modalFooter,
                `<div class="btnv6_blue_hoverfade btn_medium es_screenshot_open_btn" style="right: calc(${nextButtonOffsetWidth + fsvButton.offsetWidth}px + 1em)"><i></i></div>`);
            let openButton = modalFooter.querySelector(".es_screenshot_open_btn");
            openButton.addEventListener("click", () => {
                window.open(modalTitleLink.href, "_blank");
            });
        }

        let observer = new MutationObserver(mutations => {
            for (let mutation of mutations) {
                for (let node of mutation.addedNodes) {
                    if (node.classList.contains("screenshot_popup_modal")) {
                        initFSVButtons();
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true });
    }
}
