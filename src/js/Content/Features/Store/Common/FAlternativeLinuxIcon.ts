import Feature from "@Content/Modules/Context/Feature";
import type CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import Settings from "@Options/Data/Settings";
import ExtensionResources from "@Core/ExtensionResources";
import ContextType from "@Content/Modules/Context/ContextType";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FAlternativeLinuxIcon extends Feature<CStoreBase> {

    override checkPrerequisites(): boolean {
        return Settings.show_alternative_linux_icon;
    }

    override apply(): void {
        const url = ExtensionResources.getURL("img/alternative_linux_icon.png");

        let cssText = "";

        // react page, alternatively, use react class: .wIs-huKXogw-.EdGS6nZmIig-
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

        if (this.context.type === ContextType.STORE_FRONT) {
            cssText += `
              .tab_item.focus .tab_item_details span.platform_img.linux {
                filter: brightness(0%);
              }
            `;
        }

        DOMHelper.insertCSS(cssText);
    }
}
