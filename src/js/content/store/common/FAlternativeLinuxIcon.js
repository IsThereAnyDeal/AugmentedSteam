import { ASFeature } from "../../ASFeature.js";
import { ExtensionResources, SyncedStorage } from "../../../core.js";

export class FAlternativeLinuxIcon extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("show_alternative_linux_icon");
    }

    apply() {
        let url = ExtensionResources.getURL("img/alternative_linux_icon.png");
        let style = document.createElement("style");

        style.textContent = `span.platform_img.linux { background-image: url("${url}"); }`;
        
        document.head.appendChild(style);
    }
}