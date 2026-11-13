import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type Context from "@Content/Modules/Context/Context";

/*
 * TODO I'm not sure this is still relevant/still works
 */
export default class FSkipAgecheck extends Feature<Context> {

    override async isEnabled(): Promise<boolean> {
        return Settings.send_age_info;
    }

    override async apply(): Promise<string|null> {
        document.querySelector<HTMLButtonElement>(".contentcheck_desc_ctn button[onclick^=Proceed]")?.click();
        return null;
    }
}
