import {HTML} from "../../Core/Html/Html";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {CountryList} from "./Data/CountryList";
import {SaveIndicator} from "./SaveIndicator";

class Region {

    static init() {
        this._container = document.querySelector(".js-regions");

        this._container
            .addEventListener("click", e => { Region._removeHandler(e); });

        this._container.addEventListener("change", e => {
            const node = e.target.closest(".js-region-parent");
            if (node) {
                Region._changeFlag(node.querySelector(".es-flag"), e.target);
            }
            this._save();
        });

        document.querySelector(".js-region-add")
            .addEventListener("click", () => {
                Region._addRegionHtml("");
            });

        document.querySelector(".js-region-reset")
            .addEventListener("click", () => {
                Region.loadDefault();
                Region._save();
            });

        document.querySelector(".js-region-clear")
            .addEventListener("click", () => {
                Region._clear();
                Region._save();
            });
    }

    static loadDefault() {
        this._clear();
        SyncedStorage.remove("regional_countries");
        this.populate();
    }

    static _changeFlag(node, selectnode) {
        node.className = "";
        node.classList.add(`es-flag--${selectnode.value}`, "es-flag");
    }

    static _removeHandler(e) {
        if (!e.target || !e.target.classList || !e.target.classList.contains("js-region-remove")) { return; }
        e.target.closest(".js-region-parent").remove();
        this._save();
    }

    static _save() {
        const value = [];
        const nodes = document.querySelectorAll(".js-region");
        for (const node of nodes) {
            if (node.value && node.value !== "") {
                value.push(node.value);
            }
        }

        SyncedStorage.set("regional_countries", value);
        SaveIndicator.saved();
    }

    static _clear() {
        HTML.inner(this._container, "");
    }

    static _addRegionHtml(country) {
        let options = "";
        for (const cc in CountryList) {
            const selected = (cc.toLowerCase() === country ? " selected='selected'" : "");
            options += `<option value='${cc.toLowerCase()}'${selected}>${CountryList[cc]}</option>`;
        }

        let countryClass = "";
        if (country) {
            countryClass = `es-flag--${country}`;
        }

        const html
            = ` <div class="option js-region-parent">
                    <span class='es-flag ${countryClass}'></span>
                    <select class='option__region js-region'>${options}</select>
                    <button type="button" class="custom-link__close js-region-remove"></button>
                </div>`;

        HTML.beforeEnd(this._container, html);
    }

    static populate() {
        this._clear();
        const countries = SyncedStorage.get("regional_countries");
        for (const country of countries) {
            this._addRegionHtml(country);
        }
    }
}

export {Region};
