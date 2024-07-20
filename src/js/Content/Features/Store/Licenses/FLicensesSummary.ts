import self_ from "./FLicensesSummary.svelte";
import type CLicenses from "@Content/Features/Store/Licenses/CLicenses";
import Feature from "@Content/Modules/Context/Feature";

export default class FLicensesSummary extends Feature<CLicenses> {

    override apply(): void {
        let target = document.querySelector(".youraccount_page");
        if (!target) {
            throw new Error("Node not found");
        }

        (new self_({
            target,
            anchor: target.firstElementChild ?? undefined,
        }));
    }
}
