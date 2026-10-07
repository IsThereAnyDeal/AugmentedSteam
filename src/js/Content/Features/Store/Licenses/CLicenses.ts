import Context from "@Content/Modules/Context/Context";
import FLicensesSummary from "./FLicensesSummary";
import {EBootstrapMode, bootstrap, features} from "@Content/bootstrap";

export default class CLicenses extends Context {}

/**
 * @contentScript
 * @match *://store.steampowered.com/account/licenses
 */
(async function(): Promise<void> {
    const params = await bootstrap({mode: EBootstrapMode.Legacy});
    const context: CLicenses = new CLicenses(params);
    await features(context, [FLicensesSummary]);
})();
