import {mount, unmount} from "svelte";
import BlockingWaitModal from "./Contained/BlockingWaitModal.svelte";

export default class BlockingWaitDialog {

    private modalComponent: BlockingWaitModal | undefined;

    constructor(
        private readonly title: string,
        private readonly statusFn: () => string|string[]
    ) {}

    async update(): Promise<void> {
        if (!this.modalComponent) {
            this.modalComponent = mount(BlockingWaitModal, {
                target: document.body,
                props: {
                    title: this.title,
                    statusFn: this.statusFn
                }
            });
        }
        this.modalComponent.update();
    }

    dismiss(): void {
        if (this.modalComponent) {
            unmount(this.modalComponent);
            this.modalComponent = undefined;
        }
    }
}
