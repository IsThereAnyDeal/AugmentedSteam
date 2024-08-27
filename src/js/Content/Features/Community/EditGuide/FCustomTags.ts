import self_ from "./FCustomTags.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CEditGuide from "@Content/Features/Community/EditGuide/CEditGuide";

export default class FCustomTags extends Feature<CEditGuide> {

    override apply(): void {
        const anchor = document.querySelector("#checkboxgroup_1");
        if (!anchor) {
            throw new Error("Node not found");
        }

        // Make language options multi-selectable
        for (const tag of anchor.querySelectorAll<HTMLInputElement>("[name='tags[]']")) {
            tag.type = "checkbox";
        }

        new self_({
            target: anchor.parentElement!,
            anchor: anchor.nextElementSibling ?? undefined,
        });
    }
}
