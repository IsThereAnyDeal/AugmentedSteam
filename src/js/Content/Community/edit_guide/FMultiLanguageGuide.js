import {Feature} from "modules";

export default class FMultiLanguageGuide extends Feature {

    apply() {
        for (const tag of document.getElementsByName("tags[]")) {
            tag.type = "checkbox";
        }
    }
}
