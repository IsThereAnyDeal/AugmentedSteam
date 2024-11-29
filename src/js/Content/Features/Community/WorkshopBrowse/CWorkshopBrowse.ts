import ContextType from "@Content/Modules/Context/ContextType";
import CApp from "../App/CApp";
import FWorkshopSubscriberButtons from "./FWorkshopSubscriberButtons";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CWorkshopBrowse extends CApp {

    constructor(params: ContextParams) {

        super(params, ContextType.WORKSHOP_BROWSE, [
            FWorkshopSubscriberButtons,
        ]);
    }
}
