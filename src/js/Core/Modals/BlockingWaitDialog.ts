import type {SvelteComponent} from "svelte";
import BlockingWaitModal from "./Contained/BlockingWaitModal.svelte";

export default class BlockingWaitDialog {

    private modalComponent: SvelteComponent | undefined;

    constructor(
        private readonly title: string,
        private readonly statusFn: () => string|string[]
    ) {
    }

    async update(): Promise<void> {
        if (!this.modalComponent) {
            this.modalComponent = new BlockingWaitModal({
                target: document.body,
                props: {
                    title: this.title,
                    status: this.statusFn()
                }
            });
        }

        this.modalComponent.status = this.statusFn();
    }

    dismiss(): void {
        if (this.modalComponent) {
            this.modalComponent.$destroy();
        }
    }
}
