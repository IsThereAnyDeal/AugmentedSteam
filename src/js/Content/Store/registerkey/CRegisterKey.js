import {Context, ContextType} from "../../../Modules/content";
import FMultiProductKeys from "./FMultiProductKeys";

export class CRegisterKey extends Context {

    constructor() {
        super(ContextType.REGISTER_KEY, [
            FMultiProductKeys,
        ]);
    }
}
