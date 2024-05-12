import Feature from "@Content/Modules/Context/Feature";
import type CEditGuide from "@Content/Features/Community/EditGuide/CEditGuide";

export default class FMultiLanguageGuide extends Feature<CEditGuide> {

    apply() {
        for (const tag of document.querySelectorAll<HTMLInputElement>("[name='tags[]']")) {
            tag.type = "checkbox";
        }
    }
}
