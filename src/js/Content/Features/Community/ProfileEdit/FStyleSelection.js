import {ExtensionResources, HTML, Localization} from "../../../../modulesCore";
import {DOMHelper, Feature, ProfileData} from "../../../modulesContent";
import Config from "../../../../config";

export default class FStyleSelection extends Feature {

    apply() {

        this._active = false;

        this._checkPage();

        new MutationObserver(() => { this._checkPage(); })
            .observe(document.querySelector('[class^="profileeditshell_PageContent_"]'), {"childList": true});
    }

    _checkPage() {

        const html
            = `<div class="js-style-selection as-pd">

                <div class="as-pd__head" data-tooltip-text="${Localization.str.custom_style_help}">
                    ${Localization.str.custom_style} <span class="as-pd__help">(?)</span>
                </div>

                <div class="as-pd__cnt">
                    <div>
                        <select name="es_style" id="es_style" class="gray_bevel dynInput as-pd__select">
                            <option value="remove">${Localization.str.noneselected}</option>
                            <option value="goldenprofile2020">Lunar Sale 2020</option>
                            <option value="winter2019">Winter Sale 2019</option>
                            <option value="goldenprofile">Lunar Sale 2019</option>
                            <option value="holiday2014">Holiday Profile 2014</option>
                            <option value="blue">Blue Theme</option>
                            <option value="clear">Clear Theme</option>
                            <option value="green">Green Theme</option>
                            <option value="orange">Orange Theme</option>
                            <option value="pink">Pink Theme</option>
                            <option value="purple">Purple Theme</option>
                            <option value="red">Red Theme</option>
                            <option value="teal">Teal Theme</option>
                            <option value="yellow">Yellow Theme</option>
                            <option value="grey">Grey Theme</option>
                        </select>
                    </div>
                    <img id="es_style_preview" class="as-pd__preview" src="">
                </div>

                <div id="es_style_buttons" class="as-pd__buttons">
                    <button id="es_style_save_btn" class="DialogButton _DialogLayout Primary as-pd__btn">${Localization.str.save}</button>
                </div>
            </div>`;

        if (document.querySelector('[href$="/edit/theme"].active')) {

            if (this._active) { return; } // Happens because the below code will trigger the observer again

            HTML.beforeEnd('[class^="profileeditshell_PageContent_"]', html);
            this._active = true;

            const styleSelectNode = document.querySelector("#es_style");

            const currentStyle = ProfileData.getStyle();
            if (currentStyle) {
                styleSelectNode.value = currentStyle;

                const imgNode = document.querySelector("#es_style_preview");
                imgNode.src = ExtensionResources.getURL(`img/profile_styles/${currentStyle}/preview.png`);

                if (currentStyle === "remove") {
                    imgNode.style.display = "none";
                }
            }

            styleSelectNode.addEventListener("change", () => {
                const imgNode = document.querySelector("#es_style_preview");
                if (styleSelectNode.value === "remove") {
                    imgNode.style.display = "none";
                } else {
                    imgNode.style.display = "block";
                    imgNode.src = ExtensionResources.getURL(`img/profile_styles/${styleSelectNode.value}/preview.png`);
                }

                // Enable the "save" button
                document.querySelector("#es_style_save_btn").classList.remove("btn_disabled");
            });

            document.querySelector("#es_style_save_btn").addEventListener("click", async({target}) => {
                if (target.closest("#es_style_save_btn").classList.contains("btn_disabled")) { return; }
                await ProfileData.clearOwn();

                if (styleSelectNode.value === "remove") {
                    window.location.href = `${Config.ApiServerHost}/v01/profile/style/edit/delete/`;
                } else {
                    const selectedStyle = encodeURIComponent(styleSelectNode.value);
                    window.location.href = `${Config.ApiServerHost}/v01/profile/style/edit/save/?style=${selectedStyle}`;
                }
            });

        } else if (this._active) {
            DOMHelper.remove(".js-style-selection");
            this._active = false;
        }
    }
}
