import self_ from "./FUsefulLinks.svelte";
import type CAccount from "./CAccount";
import Feature from "@Content/Modules/Context/Feature";
import {mount} from "svelte";

export default class FUsefulLinks extends Feature<CAccount> {

    public override async checkPrerequisites(): Promise<boolean> {
        // FIXME add settings
        return true;
    }

    public override async apply(): Promise<void> {
        const anchor = document.querySelector(".account_setting_block_short");
        if (!anchor) {
            return;
        }

        mount(self_, {
            target: anchor.parentElement!,
            anchor
        })
    }
}
