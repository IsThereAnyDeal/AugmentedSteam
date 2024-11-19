import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import type {SvelteComponent} from "svelte";
import BlockingWaitModal from "./BlockingWaitModal.svelte";

let counter: number = 0;

export default class BlockingWaitDialog {

    private readonly modalId: string;
    private modalComponent: SvelteComponent | undefined;

    constructor(
        private readonly title: string,
        private readonly statusFn: () => string|string[]
    ) {
        this.modalId = `as_wait_dialog-${++counter}`;
    }

    async update(): Promise<void> {
        if (!this.modalComponent) {
            await SteamFacade.showBlockingWaitDialog(
                this.title,
                `<div id="${this.modalId}"></div>`
            );

            const target = document.querySelector<HTMLDivElement>("#" + this.modalId);
            if (target) {
                this.modalComponent = new BlockingWaitModal({target});
            } else {
                throw new Error("Failed to create blocking wait dialog");
            }
        }

        this.modalComponent.status = this.statusFn();
    }

    dismiss(): void {
        if (this.modalComponent) {
            this.modalComponent.$destroy();
            SteamFacade.dismissActiveModal(this.modalId);
        }
    }
}
