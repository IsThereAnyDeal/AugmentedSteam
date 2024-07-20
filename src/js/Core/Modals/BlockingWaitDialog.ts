import HTML from "@Core/Html/Html";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

let dialogCounter: number = 0;

export default class BlockingWaitDialog {

    private readonly id: string;

    constructor(
        private readonly title: string,
        private readonly statusFn: () => string
    ) {
        this.id = `as_wait_dialog_${++dialogCounter}`;
    }

    private getContainer(): HTMLElement|null {
        return document.querySelector("#" + this.id);
    }

    async update(): Promise<void> {
        const container = this.getContainer();
        if (container) {
            HTML.inner(container, this.statusFn());
        } else {
            await SteamFacade.showBlockingWaitDialog(
                this.title,
                `<div id="${this.id}">${this.statusFn()}</div>`
            );
        }
    }

     dismiss(): void {
        const container = this.getContainer();
        if (container) {
            SteamFacade.dismissActiveModal();
        }
    }
}
