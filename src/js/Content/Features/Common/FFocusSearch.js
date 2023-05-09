import {Feature} from "../../Modules/Feature/Feature";

export default class FFocusSearch extends Feature {

    checkPrerequisites() {

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

    apply() {

        // Tags that receive text input and should NOT trigger this feature
        const editableTags = new Set(["input", "textarea"]);

        function isContentEditable(el) {
            if (!el) { return false; }
            return editableTags.has(el.tagName.toLowerCase()) || el.isContentEditable;
        }

        document.addEventListener("keydown", e => {
            if (e.key !== "s" || e.ctrlKey || e.repeat) { return; }

            let el = document.activeElement;
            if (isContentEditable(el)) { return; }
            // Check if active element is within a shadow root, see #1623
            el = el.shadowRoot?.activeElement;
            if (isContentEditable(el)) { return; }

            e.preventDefault();
            this._node.focus();
        });
    }
}
