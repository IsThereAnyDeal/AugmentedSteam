import {HTML} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FFullscreenScreenshotView extends Feature {

    apply() {

        function toggleFullscreen(ev) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                ev.target.closest(".screenshot_popup_modal_content").requestFullscreen();
            }
        }

        function initFSVButtons() {
            const modalFooter = document.querySelector(".screenshot_popup_modal_footer");
            const nextButton = modalFooter.querySelector(".next");
            let nextButtonOffsetWidth = nextButton.offsetWidth;
            if (nextButton.style.display === "none") {
                nextButton.style.display = "";
                nextButtonOffsetWidth = nextButton.offsetWidth;
                nextButton.style.display = "none";
            }
            HTML.beforeEnd(modalFooter,
                `<div class="btnv6_blue_hoverfade btn_medium es_screenshot_fullscreen_toggle" style="right: calc(${nextButtonOffsetWidth}px + 0.5em)"><i></i></div>`);
            const fsvButton = modalFooter.querySelector(".es_screenshot_fullscreen_toggle");
            fsvButton.addEventListener("click", toggleFullscreen);

            const modalTitleLink = modalFooter.parentNode.querySelector(".screenshot_popup_modal_title > a");
            HTML.beforeEnd(modalFooter,
                `<div class="btnv6_blue_hoverfade btn_medium es_screenshot_open_btn" style="right: calc(${nextButtonOffsetWidth + fsvButton.offsetWidth}px + 1em)"><i></i></div>`);
            const openButton = modalFooter.querySelector(".es_screenshot_open_btn");
            openButton.addEventListener("click", () => {
                window.open(modalTitleLink.href, "_blank");
            });
        }

        new MutationObserver(mutations => {
            for (const {addedNodes} of mutations) {
                for (const node of addedNodes) {
                    if (node.classList.contains("screenshot_popup_modal")) {
                        initFSVButtons();
                        break;
                    }
                }
            }
        }).observe(document.body, {"childList": true});
    }
}
