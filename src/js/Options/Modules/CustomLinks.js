import {HTML, Localization, SyncedStorage} from "../../modulesCore";
import {SaveIndicator} from "./SaveIndicator";

class CustomLinks {

    constructor(container) {
        this._container = container;

        this._type = container.dataset.type;
    }

    init() {
        this._template = HTML.toElement(
            `<div class="custom-link option js-custom-link">
                <input type="checkbox" name="${this._type}_custom_enabled">
                <div>
                    <div>
                        <label class="custom-link__label">${Localization.str.options.name}</label>
                        <input class="custom-link__input" type="text" name="${this._type}_custom_name" maxlength="30">
                    </div>
                    <div>
                        <label class="custom-link__label">URL</label>
                        <input class="custom-link__input" type="text" name="${this._type}_custom_url">
                    </div>
                    <div>
                        <label class="custom-link__label">${Localization.str.options.icon}</label>
                        <input class="custom-link__input" type="text" name="${this._type}_custom_icon">
                    </div>
                </div>
                <button class="custom-link__close js-custom-link-remove"></button>
            </div>`
        );

        this._container.addEventListener("click", ({target}) => {
            if (!target.classList || !target.classList.contains("js-custom-link-remove")) { return; }
            target.closest(".js-custom-link").remove();
            this._save();
        });

        this._container.addEventListener("change", ({target}) => {
            if (!target.closest(".js-custom-link")) { return; }
            this._save();
        });

        document.querySelector(`.js-${this._type}-custom-link-add`).addEventListener("click", () => {
            this._create(SyncedStorage.defaults[`${this._type}_custom_link`][0]);
            this._save();
        });
    }

    populate() {
        HTML.inner(this._container, "");

        const links = SyncedStorage.get(`${this._type}_custom_link`);
        for (const link of links) {
            this._create(link);
        }
    }

    // TODO (KarlCastle?) Want to replace this with a CustomElement when the support is wider. CustomElements were added in FF63.
    _create(link) {
        const node = this._template.cloneNode(true);

        node.querySelector(`[name="${this._type}_custom_enabled"]`).checked = link.enabled;
        node.querySelector(`[name="${this._type}_custom_name"]`).value = link.name;
        node.querySelector(`[name="${this._type}_custom_url"]`).value = link.url;
        node.querySelector(`[name="${this._type}_custom_icon"]`).value = link.icon;

        this._container.append(node);
    }

    _read(node) {
        return {
            "enabled": node.querySelector(`[name="${this._type}_custom_enabled"]`).checked,
            "name": node.querySelector(`[name="${this._type}_custom_name"]`).value,
            "url": node.querySelector(`[name="${this._type}_custom_url"]`).value,
            "icon": node.querySelector(`[name="${this._type}_custom_icon"]`).value,
        };
    }

    _save() {
        const customLinks = this._container.querySelectorAll(".js-custom-link");
        const links = [];
        for (const row of customLinks) {
            const link = this._read(row);
            if (!link.enabled && !link.name && !link.url && !link.icon) {
                continue;
            }
            links.push(link);
        }

        SyncedStorage.set(`${this._type}_custom_link`, links);
        SaveIndicator.show();
    }
}

export {CustomLinks};
