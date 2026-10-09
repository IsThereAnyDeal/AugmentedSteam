import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import type CAgeCheck from "@Content/Features/Store/AgeCheck/CAgecheck";
import Settings from "@Options/Data/Settings";

export default class FSkipAgecheck extends Feature<CApp|CAgeCheck> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.send_age_info;
    }

    override async apply(): Promise<void> {
        document.querySelector<HTMLButtonElement>(".contentcheck_desc_ctn button[onclick^=Proceed]")?.click();
    }
}
