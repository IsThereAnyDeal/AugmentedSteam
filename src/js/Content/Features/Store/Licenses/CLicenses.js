import {Context, ContextType} from "../../../modulesContent";
import {FLicensesSummary} from "./FLicensesSummary.svelte";

export class CLicenses extends Context {

    constructor() {

        super(ContextType.LICENSES, [
            FLicensesSummary,
        ]);
    }
}
