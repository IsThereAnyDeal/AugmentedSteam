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
        if (this.modalComponent) {
            this.modalComponent.status = this.statusFn();
        } else {
            const observer = new MutationObserver(() => {
                const target = document.querySelector<HTMLDivElement>("#" + this.modalId);
                if (target) {
                    this.modalComponent = new BlockingWaitModal({
                        target,
                        props: {
                            status: this.statusFn()
                        }
                    });
                    observer.disconnect();
                }
            });
            observer.observe(document.body, {
                childList: true
            });

            await SteamFacade.showBlockingWaitDialog(
                this.title,
                `<div id="${this.modalId}"></div>`
            );
        }
    }

    dismiss(): void {
        if (this.modalComponent) {
            this.modalComponent.$destroy();
            SteamFacade.dismissActiveModal(this.modalId);
        }
    }
}
