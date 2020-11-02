import {Context, ContextType} from "../../../Modules/content";
import FTotalSpent from "./FTotalSpent";

export class CAccount extends Context {

    constructor() {
        super(ContextType.ACCOUNT, [
            FTotalSpent,
        ]);
    }
}
