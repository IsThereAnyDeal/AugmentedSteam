import Context from "@Content/Modules/Context/Context";
import FUsefulLinks from "./FUsefulLinks";
import { ContextType } from "@Content/Modules/Context/ContextType";

export default class CAccount extends Context {

    constructor() {

        super(ContextType.ACCOUNT, [
            FUsefulLinks,
        ]);
    }
}
