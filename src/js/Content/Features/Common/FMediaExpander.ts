import {__contractSlider, __expandSlider} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CSharedFiles from "@Content/Features/Community/SharedFiles/CSharedFiles";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import LocalStorage from "@Core/Storage/LocalStorage";
import ContextType from "@Content/Modules/Context/ContextType";
import DOMHelper from "@Content/Modules/DOMHelper";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FMediaExpander extends Feature<CApp|CSharedFiles> {

    private _details: HTMLElement|null = null;
    private _sliderToggle: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        this._details = document.querySelector("#game_highlights .rightcol, .workshop_item_header .col_right");
        return this._details !== null;
    }

    override async apply(): Promise<void> {
        const details = this._details!;

        HTML.beforeEnd("#highlight_player_area",
            `<div class="es_slider_toggle btnv6_blue_hoverfade btn_medium">
                <div data-tooltip-text="${L(__expandSlider)}" class="es_slider_expand"><i class="es_slider_toggle_icon"></i></div>
                <div data-tooltip-text="${L(__contractSlider)}" class="es_slider_contract"><i class="es_slider_toggle_icon"></i></div>
            </div>`);

        details.classList.add("as-side-details");

        this._sliderToggle = document.querySelector(".es_slider_toggle");
        this._sliderToggle!.addEventListener("click", () => this._toggleView());

        if (await LocalStorage.get("expand_slider")) {
            this._toggleView();
        }

        /*
         * Prevent the slider toggle from overlapping a sketchfab model's "X"
         * Example: https://steamcommunity.com/sharedfiles/filedetails/?id=606009216
         */
        const sketchfabNode = document.querySelector<HTMLElement>(".highlight_sketchfab_model");
        if (sketchfabNode) {
            const container = document.getElementById("highlight_player_area")!;
            container.addEventListener("mouseenter", () => {
                if (sketchfabNode.style.display === "none") { return; }
                this._sliderToggle!.style.top = "32px";
            });
            container.addEventListener("mouseleave", () => {
                this._sliderToggle!.style.top = "";
            });
        }
    }

    _toggleView() {
        const details = this._details!;
        const sliderToggle = this._sliderToggle!;

        const expand = !sliderToggle.classList.contains("es_expanded");

        LocalStorage.set("expand_slider", expand);

        for (const node of document.querySelectorAll(
            ".es_slider_toggle, #game_highlights, .workshop_item_header, .as-side-details"
        )) {
            node.classList.toggle("es_expanded", expand);
        }

        this._details!.addEventListener("transitionend", () => {

            if (this.context.type === ContextType.APP) {
                this._handleApp(expand);
            } else if (this.context.type === ContextType.SHARED_FILES) {
                this._handleWorkshop(expand);
            }

            /*
             * The transitionend event might not get fired when a transition is triggered immediately after appending it to the DOM
             * (which happens here).
             * This mostly happens when the page is still loading, I assume there is a race condition with the rendering calls.
             * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions#javascript_examples
             */
            setTimeout(() => { details.style.opacity = ""; }, 0);
        }, {"once": true});

        this._details!.style.opacity = "0";
    }

    _handleApp(expand: boolean): void {
        const details = this._details!;
        const clsList = details.classList;
        clsList.toggle("block", expand);
        clsList.toggle("responsive_apppage_details_left", expand);
        clsList.toggle("rightcol", !expand);

        if (expand) {
            document.querySelector(".rightcol.game_meta_data")
                ?.insertAdjacentElement("afterbegin", details);
        } else {
            document.getElementById("game_highlights")
                ?.insertAdjacentElement("afterbegin", details);
        }

        DOMHelper.insertScript("scriptlets/Common/mediaExpander_app.js");
    }

    _handleWorkshop(expand: boolean) {
        const details = this._details!;

        details.classList.toggle("panel", expand);

        if (expand) {
            document.querySelector(".sidebar")
                ?.insertAdjacentElement("afterbegin", details);
        } else {
            document.querySelector(".highlight_ctn")
                ?.insertAdjacentElement("afterend", details);
        }

        details.addEventListener("transitionend", () => {
            DOMHelper.insertScript("scriptlets/Common/mediaExpander_workshop.js");
        }, {"once": true});
    }
}
