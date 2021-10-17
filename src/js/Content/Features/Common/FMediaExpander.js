import {HTML, LocalStorage, Localization} from "../../../modulesCore";
import {ContextType, Feature} from "../../modulesContent";
import {Page} from "../Page";

export default class FMediaExpander extends Feature {

    checkPrerequisites() {
        this._details = document.querySelector("#game_highlights .rightcol, .workshop_item_header .col_right");
        return this._details !== null;
    }

    apply() {
        HTML.beforeEnd("#highlight_player_area",
            `<div class="es_slider_toggle btnv6_blue_hoverfade btn_medium">
                <div data-tooltip-text="${Localization.str.expand_slider}" class="es_slider_expand"><i class="es_slider_toggle_icon"></i></div>
                <div data-tooltip-text="${Localization.str.contract_slider}" class="es_slider_contract"><i class="es_slider_toggle_icon"></i></div>
            </div>`);

        this._details.classList.add("as-side-details");

        this._sliderToggle = document.querySelector(".es_slider_toggle");
        this._sliderToggle.addEventListener("click", () => { this._toggleView(); });

        if (LocalStorage.get("expand_slider", false)) {
            this._toggleView();
        }

        /*
         * Prevent the slider toggle from overlapping a sketchfab model's "X"
         * Example: https://steamcommunity.com/sharedfiles/filedetails/?id=606009216
         */
        const sketchfabNode = document.querySelector(".highlight_sketchfab_model");
        if (sketchfabNode) {
            const container = document.getElementById("highlight_player_area");
            container.addEventListener("mouseenter", () => {
                if (sketchfabNode.style.display === "none") { return; }
                this._sliderToggle.style.top = "32px";
            });
            container.addEventListener("mouseleave", () => {
                this._sliderToggle.style.top = null;
            });
        }
    }

    _toggleView() {

        const expand = !this._sliderToggle.classList.contains("es_expanded");

        LocalStorage.set("expand_slider", expand);

        for (const node of document.querySelectorAll(
            ".es_slider_toggle, #game_highlights, .workshop_item_header, .as-side-details"
        )) {
            node.classList.toggle("es_expanded", expand);
        }

        this._details.addEventListener("transitionend", () => {

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
            setTimeout(() => { this._details.style.opacity = null; }, 0);
        }, {"once": true});

        this._details.style.opacity = 0;
    }

    _handleApp(expand) {
        const clsList = this._details.classList;
        clsList.toggle("block", expand);
        clsList.toggle("responsive_apppage_details_left", expand);
        clsList.toggle("rightcol", !expand);

        if (expand) {
            document.querySelector(".rightcol.game_meta_data").insertAdjacentElement("afterbegin", this._details);
        } else {
            document.getElementById("game_highlights").insertAdjacentElement("afterbegin", this._details);
        }

        Page.runInPageContext(() => {
            window.SteamFacade.adjustVisibleAppTags(".popular_tags");

            /*
             * Triggers the adjustment of the slider scroll bar.
             * https://github.com/SteamDatabase/SteamTracking/blob/ad4e85261f2322eae0b0125e46d7d753bf755730/store.steampowered.com/public/javascript/gamehighlightplayer.js#L101
             */
            window.SteamFacade.jqTrigger(window, "resize.GameHighlightPlayer");
        });
    }

    _handleWorkshop(expand) {

        this._details.classList.toggle("panel", expand);

        if (expand) {
            document.querySelector(".sidebar").insertAdjacentElement("afterbegin", this._details);
        } else {
            document.querySelector(".highlight_ctn").insertAdjacentElement("afterend", this._details);
        }

        this._details.addEventListener("transitionend", () => {

            // https://github.com/SteamDatabase/SteamTracking/blob/8e19832027cf425b5db71c09c878739b5630c66a/steamcommunity.com/public/javascript/workshop_previewplayer.js#L123
            Page.runInPageContext(() => {
                const f = window.SteamFacade;
                const player = f.global("g_player");

                // g_player is null when the shared file only has one screenshot and therefore no highlight strip
                if (player === null) { return; }

                const elemSlider = f.global("$")("highlight_slider");
                const nSliderWidth = player.m_elemStripScroll.getWidth() - player.m_elemStrip.getWidth();

                // Shared files with too few screenshots won't have a slider
                if (typeof player.slider !== "undefined") {
                    player.slider.dispose();
                }

                if (nSliderWidth > 0) {
                    const newValue = player.slider.value * (nSliderWidth / player.slider.range.end);

                    player.slider = new (f.global("Control").Slider)(
                        elemSlider.down(".handle"),
                        elemSlider,
                        {
                            "range": f.global("$R")(0, nSliderWidth),
                            "sliderValue": newValue,
                            "onSlide": player.SliderOnChange.bind(player),
                            "onChange": player.SliderOnChange.bind(player),
                        }
                    );

                    f.sliderOnChange(newValue);
                } else {
                    elemSlider.hide();
                }
            });
        }, {"once": true});
    }
}
