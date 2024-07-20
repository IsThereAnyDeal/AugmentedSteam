import {__gameName} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CMarketHome from "@Content/Features/Community/MarketHome/CMarketHome";
import Feature from "@Content/Modules/Context/Feature";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import SyncedStorage from "@Core/Storage/SyncedStorage";
import Price from "@Content/Modules/Currency/Price";
import type {SortboxChangeEvent} from "@Content/Modules/Widgets/SortboxChangeEvent";

export default class FMarketSort extends Feature<CMarketHome> {

    private sortbox: SortBox|undefined;

    override checkPrerequisites(): boolean {
        // Check if user is logged in and has more than 1 active listing
        return document.querySelectorAll("#tabContentsMyActiveMarketListingsRows .market_listing_row").length > 1;
    }

    override apply(): void | Promise<void> {
        this.context.onMarketListings.subscribe(() => {
            this._insertSortbox();
            this._addPageControlsHandler();
        });
    }

    private _addPageControlsHandler() {

        // Reset sortbox after clicking page controls (we don't fetch all listings so each page is sorted individually)
        document.getElementById("tabContentsMyActiveMarketListings_controls")?.addEventListener("click", () => {
            this._insertSortbox();
        });
    }

    private async _insertSortbox(): Promise<void> {

        const container = document.getElementById("tabContentsMyActiveMarketListingsTable");
        if (!container) {
            return;
        }

        this.sortbox?.$destroy();

        const header = container.querySelector(".market_listing_table_header")!;
        const anchor = container.querySelector<HTMLElement>("h3.my_market_header");
        if (!anchor) {
            return;
        }

        this.sortbox = new SortBox({
            target: anchor.parentElement!,
            anchor,
            props: {
                name: "my_market_listings",
                options: [
                    ["default", header.querySelector(".market_listing_listed_date")!.textContent!.trim()],
                    ["item", header.querySelector(".market_listing_header_namespacer")!.parentNode!.textContent!.trim()],
                    ["game", L(__gameName).toUpperCase()],
                    ["price", header.querySelector(".market_listing_my_price")!.textContent!.trim()],
                ],
                value: (await SyncedStorage.get("sortmylistingsby")) ?? "default_ASC",
            }
        });
        this.sortbox.$on("change", (e: CustomEvent<SortboxChangeEvent>) => {
            const {value, key, direction} = e.detail;
            this._sortRows(key, direction < 0);
            SyncedStorage.set("sortmylistingsby", value);
        });
    }

    private _sortRows(sortBy: string, reversed: boolean): void {

        const container = document.getElementById("tabContentsMyActiveMarketListingsRows")!;
        const property = `esSort${sortBy}`;
        const rows: Array<[string, HTMLElement]> = [];

        // Query available listings on each sort because they may be removed
        container.querySelectorAll<HTMLElement>(".market_listing_row").forEach((node, i) => {

            // Set default position
            if (!node.dataset.esSortdefault) {
                node.dataset.esSortdefault = String(i);
            }

            let value: string|undefined = node.dataset[property];
            if (value === undefined) {
                if (sortBy === "item" || sortBy === "game") {
                    value = node.querySelector<HTMLElement>(`.market_listing_${sortBy}_name`)!.textContent!.trim();
                } else if (sortBy === "price") {
                    const price = Price.parseFromString(
                        node.querySelector<HTMLElement>(".market_listing_price span span")!.textContent!
                    );
                    if (!price) {
                        return;
                    }
                    value = String(price.value);
                }

                if (!value) { return; }
                value = String(value);
                node.dataset[property] = value;
            }

            rows.push([value, node]);
        });

        rows.sort(this._getSortFunc(sortBy));

        if (reversed) {
            rows.reverse();
        }

        rows.forEach(row => container.append(row[1]));
    }

    private _getSortFunc(sortBy: string) {
        type Param = [string, HTMLElement];

        switch (sortBy) {
            case "default":
                return (a: Param, b: Param) => Number(a[0]) - Number(b[0]);
            case "price":
                return (a: Param, b: Param) => Number(b[0]) - Number(a[0]);
            case "item":
            case "game":
                return (a: Param, b: Param) => a[0].localeCompare(b[0]);
            default:
                this.logError(
                    new Error("Invalid sorting criteria"),
                    "Can't sort market listings by criteria '%s'",
                    sortBy,
                );
                return () => 0;
        }
    }
}
