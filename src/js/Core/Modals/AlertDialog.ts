import Modal from "@Core/Modals/Contained/Modal.svelte";
import { mount, unmount } from "svelte";

export default class AlertDialog {

    constructor(
        private readonly title: string,
        private readonly body: string="",
    ) {}

    show(): Promise<void> {
        return new Promise(resolve => {
            const modal = mount(Modal, {
                            target: document.body,
                            props: {
                                title: this.title,
                                body: this.body,
                                showClose: true,
                                buttons: {
                                    cancel: "OK"
                                }
                            }
                        });
            modal.$on("button", () => {
                resolve();
                unmount(modal);
            });
        });
    }
}
