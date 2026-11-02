import self_ from "./FNewQueue.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FNewQueue extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        // FIXME settings
        return document.querySelector(".finish_queue_text") !== null;
    }

    override async apply(): Promise<string|null> {
        const next = document.querySelector(".btn_next_in_queue");
        if (!next) {
            throw new MountTargetError()
        }

        mount(self_, {
            target: next.parentElement!,
            anchor: next
        });
        return null;
    }
}
