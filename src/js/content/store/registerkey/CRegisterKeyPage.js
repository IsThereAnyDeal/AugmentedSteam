import { ASContext, ContextTypes } from "../../ASContext.js";

import { FMultiProductKeys } from "./FMultiProductKeys.js";

export class CRegisterKeyPage extends ASContext {

    constructor() {
        super([
            FMultiProductKeys,
        ]);

        this.type = ContextTypes.REGISTER_KEY;
    }
}