import {__cancel, __ok} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Modal from "@Core/Modals/Contained/Modal.svelte";
import type {EModalAction} from "@Core/Modals/Contained/EModalAction";

export default class ConfirmDialog {

    constructor(
        private readonly title: string,
        private readonly body: string="",
        private readonly buttons: {
            primary?: string,
            secondary?: string,
            cancel?: string
        } = {
            primary: L(__ok),
            cancel: L(__cancel)
        }
    ) {}

    show(): Promise<EModalAction> {
        return new Promise(resolve => {
            const modal = new Modal({
                target: document.body,
                props: {
                    title: this.title,
                    body: this.body,
                    buttons: this.buttons
                }
            });
            modal.$on("button", (e: CustomEvent<EModalAction>) => {
                resolve(e.detail);
                modal.$destroy();
            });
        });
    }
}
