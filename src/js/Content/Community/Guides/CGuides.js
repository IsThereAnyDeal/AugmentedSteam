import ContextType from "../../../Modules/Content/Context/ContextType";
import {CApp} from "../App/CApp";

import FRemoveGuidesLangFilter from "./FRemoveGuidesLangFilter";

export class CGuides extends CApp {

    constructor() {
        super(ContextType.GUIDES, [
            FRemoveGuidesLangFilter,
        ]);
    }
}
