import Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import {__activate} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FAddRedeemLink extends Feature<Context> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return this.context.user.isSignedIn;
    }

    override async apply(): Promise<string|null> {
        const node: HTMLAnchorElement|null = document.querySelector(
            this.context.isReact
                ? "header a[href*='/account/preferences/']"
                : "#account_dropdown a[href*='/account/preferences/']"
        );
        if (!node) {
            throw new MountTargetError("Didn't find node to copy for adding redeem link");
        }

        const cloned = node.cloneNode(true) as HTMLAnchorElement;
        cloned.href = "https://store.steampowered.com/account/registerkey";
        cloned.textContent = L(__activate);

        node.insertAdjacentElement("afterend", cloned);
        return null;
    }
}
