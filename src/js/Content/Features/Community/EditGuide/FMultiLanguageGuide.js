import {Feature} from "../../../Modules/Feature/Feature";

export default class FMultiLanguageGuide extends Feature {

    apply() {
        for (const tag of document.getElementsByName("tags[]")) {
            tag.type = "checkbox";
        }
    }
}
