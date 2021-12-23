import {Context, ContextType} from "../../../modulesContent";
import FUsefulLinks from "./FUsefulLinks";

export class CAccount extends Context {

    constructor() {

        super(ContextType.ACCOUNT, [
            FUsefulLinks,
        ]);
    }
}
