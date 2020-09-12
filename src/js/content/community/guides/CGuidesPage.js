import {CAppPage} from "community/app/CAppPage";
import {ContextTypes} from "modules/ASContext";

import {FRemoveGuidesLangFilter} from "./FRemoveGuidesLangFilter";

export class CGuidesPage extends CAppPage {

    constructor() {
        super([
            FRemoveGuidesLangFilter,
        ]);

        this.type = ContextTypes.GUIDES;
    }
}
