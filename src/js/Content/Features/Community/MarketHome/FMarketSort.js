import {Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, Price, Sortbox} from "../../../modulesContent";

export default class FMarketSort extends Feature {

    checkPrerequisites() {
        // Check if user is logged in and has more than 1 active listing
        return document.querySelectorAll("#tabContentsMyActiveMarketListingsRows .market_listing_row").length > 1;
    }

    apply() {

        this._insertSortbox();
        this._addPageControlsHandler();

        // If there're page controls, observe the listings because Steam refreshes them after selecting a page size option
        if (document.getElementById("tabContentsMyActiveMarketListings_ctn") !== null) {
            new MutationObserver(() => {
                this._insertSortbox();
                this._addPageControlsHandler();
            }).observe(document.getElementById("tabContentsMyListings"), {"childList": true});
        }
    }

    _addPageControlsHandler() {

        // Reset sortbox after clicking page controls (we don't fetch all listings so each page is sorted individually)
        document.getElementById("tabContentsMyActiveMarketListings_controls")?.addEventListener("click", () => {
            this._insertSortbox();
        });
    }

    _insertSortbox() {

        const container = document.getElementById("tabContentsMyActiveMarketListingsTable");
        const header = container.querySelector(".market_listing_table_header");

        if (container.querySelector(".es-sortbox") !== null) {
            container.querySelector(".es-sortbox").remove();
            Sortbox.reset();
        }

        container.querySelector("h3.my_market_header").insertAdjacentElement("beforebegin", Sortbox.get(
            "my_market_listings",
            [
                ["default", header.querySelector(".market_listing_listed_date").textContent.trim()],
                ["item", header.querySelector(".market_listing_header_namespacer").parentNode.textContent.trim()],
                ["game", Localization.str.game_name.toUpperCase()],
                ["price", header.querySelector(".market_listing_my_price").textContent.trim()],
            ],
            SyncedStorage.get("sortmylistingsby"),
            (sortBy, reversed) => { this._sortRows(sortBy, reversed); },
            "sortmylistingsby"
        ));
    }

    _sortRows(sortBy, reversed) {

        const container = document.getElementById("tabContentsMyActiveMarketListingsRows");
        const property = `esSort${sortBy}`;
        const rows = [];

        // Query available listings on each sort because they may be removed
        container.querySelectorAll(".market_listing_row").forEach((node, i) => {

            // Set default position
            if (!node.dataset.esSortdefault) {
                node.dataset.esSortdefault = i;
            }

            let value = node.dataset[property];
            if (typeof value === "undefined") {
                if (sortBy === "item" || sortBy === "game") {
                    value = node.querySelector(`.market_listing_${sortBy}_name`).textContent.trim();
                } else if (sortBy === "price") {
                    value = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent).value;
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

    _getSortFunc(sortBy) {
        switch (sortBy) {
            case "default":
                return (a, b) => Number(a[0]) - Number(b[0]);
            case "price":
                return (a, b) => Number(b[0]) - Number(a[0]);
            case "item":
            case "game":
                return (a, b) => a[0].localeCompare(b[0]);
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
