import self_ from "./FUsefulLinks.svelte";
import type CAccount from "./CAccount";
import Feature from "@Content/Modules/Context/Feature";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FUsefulLinks extends Feature<CAccount> {

    public override async isEnabled(): Promise<boolean> {
        // FIXME add settings
        return true;
    }

    public override async apply(): Promise<string|null> {
        const anchor = document.querySelector(".account_setting_block_short");
        if (!anchor) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: anchor.parentElement!,
            anchor
        });

        return null;
    }
}
