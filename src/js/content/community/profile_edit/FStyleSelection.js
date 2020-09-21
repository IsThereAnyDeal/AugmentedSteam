import {ASFeature} from "modules";

import {ExtensionResources, HTML, Localization} from "core";
import {ExtensionLayer} from "common";
import {ProfileData} from "community/common";
import Config from "config";

export class FStyleSelection extends ASFeature {

    apply() {
        
        this._active = false;

        this._checkPage();

        new MutationObserver(() => { this._checkPage(); })
            .observe(document.querySelector(`[class^="profileeditshell_PageContent_"]`), {"childList": true});
    }

    _checkPage() {

        const html =
            `<div class="js-style-selection as-pd">
                
                <div class='as-pd__head' data-tooltip-text='${Localization.str.custom_style_help}'>
                    ${Localization.str.custom_style} <span class="as-pd__help">(?)</span>
                </div>
                
                <div class="as-pd__cnt">
                    <div>
                        <select name='es_style' id='es_style' class='gray_bevel dynInput as-pd__select'>
                            <option id='remove' value='remove'>${Localization.str.noneselected}</option>
                            <option id='goldenprofile' value='goldenprofile'>Lunar Sale 2019</option>
                            <option id='holiday2014' value='holiday2014'>Holiday Profile 2014</option>
                            <option id='blue' value='blue'>Blue Theme</option>
                            <option id='clear' value='clear'>Clear Theme</option>
                            <option id='green' value='green'>Green Theme</option>
                            <option id='orange' value='orange'>Orange Theme</option>
                            <option id='pink' value='pink'>Pink Theme</option>
                            <option id='purple' value='purple'>Purple Theme</option>
                            <option id='red' value='red'>Red Theme</option>
                            <option id='teal' value='teal'>Teal Theme</option>
                            <option id='yellow' value='yellow'>Yellow Theme</option>
                            <option id='grey' value='grey'>Grey Theme</option>
                        </select>
                    </div>
                    <img id='es_style_preview' class="as-pd__preview" src=''>
                </div>
                
                <div id="es_style_buttons" class="as-pd__buttons">
                    <button id='es_style_save_btn' class='DialogButton _DialogLayout Primary as-pd__btn'>${Localization.str.save}</button>
                </div>
            </div>`;

        if (document.querySelector(`[href$="/edit/theme"].active`)) {

            if (this._active) { return; } // Happens because the below code will trigger the observer again

            HTML.beforeEnd(`[class^="profileeditshell_PageContent_"]`, html);
            this._active = true;

            ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

            let styleSelectNode = document.querySelector("#es_style");

            let currentStyle = ProfileData.getStyle();
            if (currentStyle) {
                styleSelectNode.value = currentStyle;

                let imgNode = document.querySelector("#es_style_preview");
                imgNode.src = ExtensionResources.getURL("img/profile_styles/" + currentStyle + "/preview.png");

                if (currentStyle === "remove") {
                    imgNode.style.display = "none";
                }
            }

            styleSelectNode.addEventListener("change", () => {
                let imgNode = document.querySelector("#es_style_preview");
                if (styleSelectNode.value === "remove") {
                    imgNode.style.display = "none";
                } else {
                    imgNode.style.display = "block";
                    imgNode.src = ExtensionResources.getURL("img/profile_styles/" + styleSelectNode.value + "/preview.png");
                }

                // Enable the "save" button
                document.querySelector("#es_style_save_btn").classList.remove("btn_disabled");
            });

            document.querySelector("#es_style_save_btn").addEventListener("click", async ({target}) => {
                if (target.closest("#es_style_save_btn").classList.contains("btn_disabled")) { return; }
                await ProfileData.clearOwn();

                if (styleSelectNode.value === "remove") {
                    window.location.href = Config.ApiServerHost + "/v01/profile/style/edit/delete/";
                } else {
                    let selectedStyle = encodeURIComponent(styleSelectNode.value);
                    window.location.href = Config.ApiServerHost+`/v01/profile/style/edit/save/?style=${selectedStyle}`;
                }
            });

        } else if (this._active) {
            DOMHelper.remove(".js-style-selection");
            this._active = false;
        }
    }
}
