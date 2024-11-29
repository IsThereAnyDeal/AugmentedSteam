import ContextType from "@Content/Modules/Context/ContextType";
import CApp from "../App/CApp";
import FRemoveGuidesLangFilter from "./FRemoveGuidesLangFilter";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CGuides extends CApp {

    constructor(params: ContextParams) {
        super(params, ContextType.GUIDES, [
            FRemoveGuidesLangFilter,
        ]);
    }
}
