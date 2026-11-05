import Feature from "@Content/Modules/Context/Feature";
import type CRegisterKey from "@Content/Features/Store/RegisterKey/CRegisterKey";
import RegisterMultipleButton from "@Content/Features/Store/RegisterKey/Components/RegisterMultipleButton.svelte";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FMultiProductKeys extends Feature<CRegisterKey> {

    public override async isEnabled(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    public override async apply(): Promise<string|null> {
        const anchor: HTMLElement|null = document.querySelector("#registerkey_examples_text");
        if (!anchor) {
            throw new MountTargetError();
        }

        mount(RegisterMultipleButton, {
            target: anchor.parentElement!,
            anchor,
            props: {
                user: this.context.user
            }
        });
        return null;
    }
}
