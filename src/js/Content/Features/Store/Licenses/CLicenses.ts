import Context from "@Content/Modules/Context/Context";
import {FLicensesSummary} from "./FLicensesSummary.svelte";
import {ContextType} from "@Content/Modules/Context/ContextType";

export default class CLicenses extends Context {

    constructor() {

        super(ContextType.LICENSES, [
            FLicensesSummary
        ]);
    }
}
