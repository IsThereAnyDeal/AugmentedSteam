import {BackgroundSimple, HTML, SyncedStorage} from "../../modulesCore";

class StoreListBuilder {

    constructor() {
        this._container = document.querySelector(".js-store-stores");
    }

    async build() {

        // This section is re-built on options reset
        HTML.inner(this._container, "");

        const storeList = await BackgroundSimple.action("itad.storelist").catch(err => console.error(err));
        if (!storeList) { return; }

        const excludedStores = SyncedStorage.get("excluded_stores");

        let html = "";
        for (const {id, title, color} of storeList) {
            const checked = excludedStores.includes(id) ? "" : " checked";

            html += `<div class="option option--store">
                        <input type="checkbox" id="${id}"${checked}>
                        <label for="${id}" style="color: ${color}">${title}</label>
                    </div>`;
        }

        HTML.inner(this._container, html);
    }
}

export {StoreListBuilder};
