import {ExtensionResources, SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";

export default class FAlternativeLinuxIcon extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_alternative_linux_icon");
    }

    apply() {
        const url = ExtensionResources.getURL("img/alternative_linux_icon.png");
        const style = document.createElement("style");

        let cssText = `span.platform_img.linux { background-image: url(${url}) !important; }`;

        if (this.context.type === ContextType.STORE_FRONT) {
            cssText += ".tab_item.focus .tab_item_details span.platform_img.linux { filter: brightness(20%); }";
        }

        style.textContent = cssText;
        document.head.appendChild(style);
    }
}
