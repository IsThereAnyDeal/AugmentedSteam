import {__cancel} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Modal from "@Core/Modals/Contained/Modal.svelte";

export default class ConfirmDialog {

    constructor(
        private readonly title: string,
        private readonly body: string="",
        private readonly buttons: {
            primary?: string,
            secondary?: string,
            cancel?: string
        } = {
            primary: "OK",
            cancel: L(__cancel)
        }
    ) {}

    show(): Promise<"OK"|"SECONDARY"|"CANCEL"> {
        return new Promise(resolve => {
            const modal = new Modal({
                target: document.body,
                props: {
                    title: this.title,
                    body: this.body,
                    buttons: this.buttons
                }
            });
            modal.$on("button", (e: CustomEvent<"OK"|"SECONDARY"|"CANCEL">) => {
                resolve(e.detail);
                modal.$destroy();
            });
        });
    }
}