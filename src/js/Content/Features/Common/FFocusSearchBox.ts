import Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import SelectorMap from "@Content/SelectorMap";

export default class FFocusSearchBox extends Feature<Context> {

    override async checkPrerequisites(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<void> {

        const selectors = this.context.isReact
            ? [
                "input.Focusable" // Wishlist
            ] : [
                SelectorMap.store.searchbox,
                "#store_nav_search_term", // Store pages
                "input.discussionSearchText", // Community discussions
                "#workshopSearchText", // Workshop
                "#findItemsSearchBox", // Market
                "input#filter_control", // Inventory
                // TODO support dynamic pages e.g. groups/friends, Games page (React)
            ];

        const node = document.querySelector<HTMLElement>(selectors.join(","));
        if (!node) { return; }

        function isContentEditable(el: Element): boolean {
            return el.tagName === "INPUT"
                || el.tagName === "TEXTAREA"
                || (el instanceof HTMLElement && el.isContentEditable);
        }

        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "s" || e.ctrlKey || e.repeat) { return; }

            let el = document.activeElement;
            if (el && isContentEditable(el)) { return; }

            // Check if active element is within a shadow root, see #1623
            el = el?.shadowRoot?.activeElement ?? null;
            if (el && isContentEditable(el)) { return; }

            e.preventDefault();
            node.focus();
        });
    }
}