import {Context, ContextType} from "../../../modulesContent";
import FTotalSpent from "./FTotalSpent";

export class CAccount extends Context {

    constructor() {
        super(ContextType.ACCOUNT, [
            FTotalSpent,
        ]);
    }
}
