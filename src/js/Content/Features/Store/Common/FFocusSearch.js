import {Feature} from "../../../Modules/Feature/Feature";

export default class FFocusSearch extends Feature {

    checkPrerequisites() {
        this._node = document.querySelector("#store_nav_search_term");
        return this._node !== null;
    }

    apply() {

        // Tags that should NOT trigger this feature when focused
        const focusableTags = new Set(["input", "textarea"]);

        document.addEventListener("keydown", e => {
            if (
                e.key === "s"
                && !e.repeat
                && !focusableTags.has(document.activeElement?.tagName.toLowerCase())
            ) {
                e.preventDefault();
                this._node.focus();
            }
        });
    }
}
