import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import type {SvelteComponent} from "svelte";

let counter = 0;

export default async function(options: {
    modalFn: (target: HTMLElement) => SvelteComponent,
    title: string,
    options?: {
        okButton?: string, // Default "OK"
        cancelButton?: string,  // Default "Cancel"
        secondaryActionButton?: string, // Needs a value else won't get rendered
        explicitConfirm?: boolean, // Avoids releasing Enter from auto-confirming
        explicitDismissal?: boolean // Avoids dismissal on clicking on background
    }
}): Promise<"OK"|"SECONDARY"|"CANCEL"> {

    ++counter;
    const modalId = `as_modal-${counter}`;
    let modalComponent: SvelteComponent | undefined;

    const observer = new MutationObserver(() => {
        const modal = document.querySelector<HTMLDivElement>("#"+modalId);
        if (modal) {
            modalComponent = options.modalFn(modal);
            observer.disconnect();
        }
    });
    observer.observe(document.body, {
        childList: true
    });

    const response = await SteamFacade.showConfirmDialog(
        options.title,
        `<div id="${modalId}"></div>`,
        options.options
    );

    modalComponent?.$destroy();
    return response;
}