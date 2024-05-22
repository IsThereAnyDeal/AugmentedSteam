import Feature from "@Content/Modules/Context/Feature";
import CBase from "@Content/Features/Common/CBase";
import CAgeCheck from "@Content/Features/Store/AgeCheck/CAgecheck";
import type CRegisterKey from "@Content/Features/Store/RegisterKey/CRegisterKey";

export default class FFocusSearch extends Feature<CBase|CAgeCheck|CRegisterKey> {

    private _node: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        this._node = document.querySelector([
            "#store_nav_search_term", // Store pages
            "input.discussionSearchText", // Community discussions
            "#wishlist_search", // Wishlist
            "#workshopSearchText", // Workshop
            "#findItemsSearchBox", // Market
            // TODO support dynamic pages e.g. groups/friends, Games page (React)
        ].join(","));

        return this._node !== null;
    }

    override apply(): void {

        // Tags that receive text input and should NOT trigger this feature
        const editableTags = new Set(["input", "textarea"]);

        function isContentEditable(el: Element|null) {
            if (!el) { return false; }
            return editableTags.has(el.tagName.toLowerCase()) || (el instanceof HTMLElement && el.isContentEditable);
        }

        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "s" || e.ctrlKey || e.repeat) { return; }

            let el = document.activeElement;
            if (isContentEditable(el)) { return; }
            // Check if active element is within a shadow root, see #1623
            el = el?.shadowRoot?.activeElement ?? null;
            if (isContentEditable(el)) { return; }

            e.preventDefault();
            this._node?.focus();
        });
    }
}
