import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, LocalStorage, Localization} from "../../../../modulesCore";

export default class FReviewToggleButton extends Feature {

    checkPrerequisites() {
        return document.getElementById("review_create") !== null;
    }

    apply() {
        const head = document.querySelector("#review_create h1");

        // Reparent review section nodes
        const newParent = document.createElement("div");
        newParent.classList.add("es_review_section");
        newParent.append(
            ...document.getElementById("review_create").querySelectorAll("p, .avatar_block, .content")
        );

        head.insertAdjacentElement("afterend", newParent);

        // Insert review toggle button
        HTML.beforeEnd(head,
            `<div class="btnv6_lightblue_blue btn_medium" id="es_review_toggle">
                <div data-tooltip-text="${Localization.str.expand_slider}" class="es_review_expand">▼</div>
                <div data-tooltip-text="${Localization.str.contract_slider}" class="es_review_contract">▲</div>
            </div>`);

        document.querySelector("#es_review_toggle").addEventListener("click", () => {
            this._toggleReviews();
        });

        this._toggleReviews(LocalStorage.get("show_review_section"));
    }

    _toggleReviews(state) {

        let _state = state;

        if (typeof _state === "undefined") {
            _state = !LocalStorage.get("show_review_section");
            LocalStorage.set("show_review_section", _state);
        }

        document.getElementById("review_create").classList.toggle("es_contracted", !_state);
    }
}
