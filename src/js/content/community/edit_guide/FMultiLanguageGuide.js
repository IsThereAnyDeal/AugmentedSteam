import {ASFeature} from "modules/ASFeature";

export class FMultiLanguageGuide extends ASFeature {

    apply() {
        for (const tag of document.getElementsByName("tags[]")) {
            tag.type = "checkbox";
        }
    }
}
