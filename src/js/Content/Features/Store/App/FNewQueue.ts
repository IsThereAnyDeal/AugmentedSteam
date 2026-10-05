import self_ from "./FNewQueue.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import { mount } from "svelte";

export default class FNewQueue extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return document.querySelector(".finish_queue_text") !== null;
    }

    override apply(): void {
        const next = document.querySelector(".btn_next_in_queue");
        if (!next) {
            return;
        }

        mount(self_, {
                    target: next.parentElement!,
                    anchor: next
                });
    }
}
