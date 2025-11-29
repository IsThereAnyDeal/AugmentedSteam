import self_ from "./FNewQueue.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";

export default class FNewQueue extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return document.querySelector(".finish_queue_text") !== null;
    }

    override apply(): void {
        const next = document.querySelector(".btn_next_in_queue");
        if (!next) {
            return;
        }

        new self_({
            target: next.parentElement,
            anchor: next
        });
    }
}
