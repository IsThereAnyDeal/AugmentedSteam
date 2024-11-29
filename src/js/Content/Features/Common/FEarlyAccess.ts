import type CBase from "@Content/Features/Common/CBase";
import Feature from "@Content/Modules/Context/Feature";
import EarlyAccessUtils from "@Content/Modules/EarlyAccess/EarlyAccessUtils";

export default class FEarlyAccess extends Feature<CBase> {

    public override async apply(): Promise<void> {
        await EarlyAccessUtils.show(this.context.language);
    }
}
