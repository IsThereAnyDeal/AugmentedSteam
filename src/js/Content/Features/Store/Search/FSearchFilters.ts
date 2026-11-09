import self_ from "./FSearchFilters.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CSearch from "@Content/Features/Store/Search/CSearch";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import {MountTargetError} from "@Core/Errors/Errors";
import {mount} from "svelte";
import FilterState from "./Filters/FilterState.svelte";

export type FilterFn = (row: HTMLElement) => boolean;

export default class FSearchFilters extends Feature<CSearch> {

    #filters: Array<FilterFn> = [];

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const collapseName = "augmented_steam";

        const rightColNode = document.querySelector("#advsearchform .rightcol");
        if (!rightColNode) {
            throw new MountTargetError();
        }

        const searchResultsParent = document.querySelector("#search_results");
        if (!searchResultsParent) {
            throw new MountTargetError();
        }

        const status = new FilterState();
        status.onUpdate = () => {
            this.#reset();
            this.#filter();
        };
        status.parseUrl();

        mount(self_, {
            target: rightColNode,
            anchor: rightColNode.firstElementChild ?? undefined,
            props: {
                collapseName,
                status,
                register: (filter: FilterFn) => this.#filters.push(filter)
            }
        });

        // Allow user to autocollapse the added category block just like any other
        DOMHelper.insertScript("scriptlets/Store/Search/addCollapseHandlers.js", {
            collapseName,
            shouldCollapse: false // FIXME this.#filters.every(filter => !filter.active)
        });

        this.#filter();
        const observer = new MutationObserver(() => {
            this.#filter();
        });
        observer.observe(searchResultsParent, {
            childList: true,
            subtree: true
        });
        return null;
    }

    #reset(): void {
        const rows = document.querySelectorAll("a.search_result_row.as-filtered");
        for (const row of rows) {
            row.classList.remove("as-filtered", "as-hide");
        }
    }

    #filter(): void {
        const rows = document.querySelectorAll<HTMLElement>("a.search_result_row:not(.as-filtered)");

        for (const row of rows) {
            row.classList.add("as-filtered");

            for (const filter of this.#filters) {
                const passes = filter(row);
                if (!passes) {
                    row.classList.add("as-hide");
                    break;
                }
            }
        }
    }
}
