import {__customStyle, __customStyleHelp, __noneselected, __save} from "@Strings/_strings";
import Config from "config";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileEdit from "@Content/Features/Community/ProfileEdit/CProfileEdit";
import HTML from "@Core/Html/Html";
import ExtensionResources from "@Core/ExtensionResources";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";

export default class FStyleSelection extends Feature<CProfileEdit> {

    private active: boolean = false;
    private currentStyle: string|null = null;

    override async checkPrerequisites(): Promise<boolean> {

        const result = await this.context.data;
        if (!result) { return false; }

        this.currentStyle = result.style;
        return true;
    }

    override apply(): void {
        document.addEventListener("as_profileNav", () => this.callback());
        this.callback();
    }

    private callback(): void {
        if (!document.querySelector('[href$="/edit/theme"].active')) {
            document.querySelector(".js-style-selection")?.remove();
            this.active = false;
            return;
        }

        if (this.active) { return; }
        this.active = true;

        const html
            = `<div class="js-style-selection as-pd">

                <div class="as-pd__head" data-tooltip-text="${L(__customStyleHelp)}">
                    ${L(__customStyle)} <span class="as-pd__help">(?)</span>
                </div>

                <div class="as-pd__cnt">
                    <div>
                        <select name="es_style" class="gray_bevel dynInput as-pd__select js-pd-style-select">
                            <option value="remove">${L(__noneselected)}</option>
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
                    <button class="DialogButton _DialogLayout Primary as-pd__btn js-pd-style-save">${L(__save)}</button>
                </div>
            </div>`;

        HTML.beforeEnd(this.context.root!.querySelector(":scope > div:last-child > div:last-child"), html);

        const styleSelectNode = document.querySelector<HTMLInputElement>(".js-pd-style-select")!;
        const stylePreviewNode = document.querySelector<HTMLImageElement>(".js-pd-style-preview")!;

        // Show current selection
        if (this.currentStyle) {
            styleSelectNode.value = this.currentStyle;

            if (this.currentStyle === "remove") {
                stylePreviewNode.style.display = "none";
            } else {
                stylePreviewNode.src = ExtensionResources.getURL(`img/profile_styles/${this.currentStyle}/preview.png`);
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

        document.querySelector(".js-pd-style-save")!.addEventListener("click", async() => {
            if (styleSelectNode.value === "remove" && !this.currentStyle) { return; }
            if (styleSelectNode.value === this.currentStyle) { return; }

            await AugmentedSteamApiFacade.clearOwn(this.context.steamId);

            if (styleSelectNode.value === "remove") {
                window.location.href = `${Config.ApiServerHost}/profile/style/delete/v2`;
            } else {
                const style = encodeURIComponent(styleSelectNode.value);
                window.location.href = `${Config.ApiServerHost}/profile/style/save/v2?style=${style}`;
            }
        });
    }
}
