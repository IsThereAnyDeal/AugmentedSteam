import {Context, ContextType} from "../../../Modules/content";
import FMultiProductKeys from "./FMultiProductKeys";

export class CRegisterKey extends Context {

    constructor() {
        super([
            FMultiProductKeys,
        ]);

        this.type = ContextType.REGISTER_KEY;
    }
}
