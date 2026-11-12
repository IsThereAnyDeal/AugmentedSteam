import self_ from "./FEarlyAccessSearch.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CSearch from "@Content/Features/Store/Search/CSearch";
import {mount} from "svelte";
import Settings from "@Options/Data/Settings";

export default class FEarlyAccessSearch extends Feature<CSearch> {

    override async isEnabled(): Promise<boolean> {
        return Settings.show_early_access;
    }

    override async apply(): Promise<null> {
        this.#addSashes();
        this.context.onMutation(() => this.#addSashes());
        return null;
    }

    #addSashes(): void {
        const nodes = document.querySelectorAll<HTMLElement>(".search_result_row[data-as-ea]:not([data-as-ea-sash])");
        for (const target of nodes) {
            target.dataset.asEaSash = "1";
            mount(self_, {target});
        }
    }
}
