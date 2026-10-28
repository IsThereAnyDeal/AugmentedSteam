import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import ExtensionResources from "@Core/ExtensionResources";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import type Context from "@Content/Modules/Context/Context";

export default class FAlternativeLinuxIcon extends Feature<Context> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.show_alternative_linux_icon;
    }

    override async apply(): Promise<void> {
        const url = ExtensionResources.getURL("img/alternative_linux_icon.png");

        let cssText = "";

        // react page
        cssText += `
            span[title*='Linux'] svg {
              visibility:hidden
            }
            span[title*='Linux']:has(svg) {
              background-image: url(${url});
              background-repeat: no-repeat;
              background-position: center;
            }
        `;

        // legacy
        cssText += `
            span.platform_img.linux {
              background-image: url(${url}) !important;
            }
        `;

        DOMHelper.insertCSS(cssText);
    }
}
