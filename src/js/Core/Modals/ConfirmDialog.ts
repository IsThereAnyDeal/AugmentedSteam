import {__cancel, __ok} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Modal from "@Core/Modals/Contained/Modal.svelte";
import {mount, unmount} from "svelte";

export default function(props: {
    title: string,
    body?: string,
    primary?: string,
    cancel?: string
}): Promise<boolean> {
    return new Promise<boolean>(resolve => {
        const modal = mount(Modal, {
            target: document.body,
            props: {
                title: props.title,
                body: props.body,
                buttons: {
                    primary: props.primary ?? L(__ok),
                    cancel: props.cancel ?? L(__cancel)
                },
                onprimary: () => {
                    resolve(true);
                    unmount(modal)
                },
                oncancel: () => {
                    resolve(false);
                    unmount(modal)
                }
            }
        });
    });
}
