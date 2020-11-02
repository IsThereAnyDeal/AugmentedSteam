import {Context, ContextType} from "../../../Modules/Content";
import FTotalSpent from "./FTotalSpent";

export class CAccount extends Context {

    constructor() {
        super(ContextType.ACCOUNT, [
            FTotalSpent,
        ]);
    }
}
