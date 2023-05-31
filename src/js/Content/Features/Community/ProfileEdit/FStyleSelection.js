import {ExtensionResources, HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import Config from "../../../../config";

export default class FStyleSelection extends Feature {

    async checkPrerequisites() {

        const result = await this.context.data;
        if (!result) { return false; }

        this._currentStyle = result.style;
        return true;
    }

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
                        <select name="es_style" class="gray_bevel dynInput as-pd__select js-pd-style-select">
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
                    <img class="as-pd__preview js-pd-style-preview" src="">
                </div>

                <div class="as-pd__buttons">
                    <button class="DialogButton _DialogLayout Primary as-pd__btn js-pd-style-save">${Localization.str.save}</button>
                </div>
            </div>`;

        if (document.querySelector('[href$="/edit/theme"].active')) {

            if (this._active) { return; } // Happens because the below code will trigger the observer again

            HTML.beforeEnd('[class^="profileeditshell_PageContent_"]', html);
            this._active = true;

            const styleSelectNode = document.querySelector(".js-pd-style-select");
            const stylePreviewNode = document.querySelector(".js-pd-style-preview");

            // Show current selection
            if (this._currentStyle) {
                styleSelectNode.value = this._currentStyle;

                if (this._currentStyle === "remove") {
                    stylePreviewNode.style.display = "none";
                } else {
                    stylePreviewNode.src = ExtensionResources.getURL(`img/profile_styles/${this._currentStyle}/preview.png`);
                }
            } else {
                styleSelectNode.value = "remove";
            }

            styleSelectNode.addEventListener("change", () => {
                if (styleSelectNode.value === "remove") {
                    stylePreviewNode.style.display = "none";
                } else {
                    stylePreviewNode.style.display = "block";
                    stylePreviewNode.src = ExtensionResources.getURL(`img/profile_styles/${styleSelectNode.value}/preview.png`);
                }
            });

            document.querySelector(".js-pd-style-save").addEventListener("click", async() => {
                if (styleSelectNode.value === "remove" && !this._currentStyle) { return; }
                if (styleSelectNode.value === this._currentStyle) { return; }

                await this.context.clearOwn();

                if (styleSelectNode.value === "remove") {
                    window.location.href = `${Config.ApiServerHost}/v01/profile/style/edit/delete/`;
                } else {
                    const style = encodeURIComponent(styleSelectNode.value);
                    window.location.href = `${Config.ApiServerHost}/v01/profile/style/edit/save/?style=${style}`;
                }
            });

        } else if (this._active) {
            document.querySelector(".js-style-selection")?.remove();
            this._active = false;
        }
    }
}
