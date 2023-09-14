import ContextType from "../../../Modules/Context/ContextType";
import {CApp} from "../App/CApp";
import FWorkshopSubscriberButtons from "./FWorkshopSubscriberButtons";

export class CWorkshopBrowse extends CApp {

    constructor() {
        super(ContextType.WORKSHOP_BROWSE, [
            FWorkshopSubscriberButtons,
        ]);
    }
}
