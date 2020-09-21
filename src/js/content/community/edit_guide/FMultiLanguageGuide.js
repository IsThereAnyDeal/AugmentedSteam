import {Feature} from "modules";

export class FMultiLanguageGuide extends Feature {

    apply() {
        for (const tag of document.getElementsByName("tags[]")) {
            tag.type = "checkbox";
        }
    }
}
