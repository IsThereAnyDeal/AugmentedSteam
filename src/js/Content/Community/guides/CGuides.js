import {CApp} from "community/app/CApp";
import {ContextTypes} from "modules";

import FRemoveGuidesLangFilter from "./FRemoveGuidesLangFilter";

export class CGuides extends CApp {

    constructor() {
        super([
            FRemoveGuidesLangFilter,
        ]);

        this.type = ContextTypes.GUIDES;
    }
}
