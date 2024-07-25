import ContextType from "@Content/Modules/Context/ContextType";
import CApp from "../App/CApp";
import FWorkshopSubscriberButtons from "./FWorkshopSubscriberButtons";

export default class CWorkshopBrowse extends CApp {

    constructor() {
        super(ContextType.WORKSHOP_BROWSE, [
            FWorkshopSubscriberButtons,
        ]);
    }
}
