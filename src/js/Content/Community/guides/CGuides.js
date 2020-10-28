import {CApp} from "community/app/CApp";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FRemoveGuidesLangFilter from "./FRemoveGuidesLangFilter";

export class CGuides extends CApp {

    constructor() {
        super([
            FRemoveGuidesLangFilter,
        ]);

        this.type = ContextType.GUIDES;
    }
}
