import {Feature} from "../../../Modules/Feature/Feature";
import {ExtensionResources} from "../../../../Core/ExtensionResources";
import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";

export default class FAlternativeLinuxIcon extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_alternative_linux_icon");
    }

    apply() {
        const url = ExtensionResources.getURL("img/alternative_linux_icon.png");
        const style = document.createElement("style");

        style.textContent = `
            span.platform_img.linux {
                background-image: url(${url}) !important;
            }
            .tab_item.focus .tab_item_details span.platform_img.linux {
                filter: brightness(20%);
            }`;

        document.head.appendChild(style);
    }
}
