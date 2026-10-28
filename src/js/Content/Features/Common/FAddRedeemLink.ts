import Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import {__activate} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";

export default class FAddRedeemLink extends Feature<Context> {

    override async checkPrerequisites(): Promise<boolean> {
        // FIXME setting
        return this.context.user.isSignedIn;
    }

    override async apply(): Promise<void> {

        let node: HTMLAnchorElement|null;

        node = document.querySelector(
            this.context.isReact
                ? "header a[href*='/account/preferences/']"
                : "#account_dropdown a[href*='/account/preferences/']"
        );
        if (!node) {
            console.error("Didn't find node to copy for adding redeem link");
            return;
        }

        const cloned = node.cloneNode(true) as HTMLAnchorElement;
        cloned.href = "https://store.steampowered.com/account/registerkey";
        cloned.textContent = L(__activate);

        node.insertAdjacentElement("afterend", cloned);
    }
}
