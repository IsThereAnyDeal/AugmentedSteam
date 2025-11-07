import Feature from "@Content/Modules/Context/Feature";
import type CRegisterKey from "@Content/Features/Store/RegisterKey/CRegisterKey";
import RegisterMultipleButton from "@Content/Features/Store/RegisterKey/Components/RegisterMultipleButton.svelte";
import { mount } from "svelte";

export default class FMultiProductKeys extends Feature<CRegisterKey> {

    override apply(): void {
        const anchor: HTMLElement|null = document.querySelector("#registerkey_examples_text");

        if (anchor) {
            mount(RegisterMultipleButton, {
                            target: anchor.parentElement!,
                            anchor,
                            props: {
                                user: this.context.user
                            }
                        });
        }
    }
}
