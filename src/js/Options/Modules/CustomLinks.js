import {HTML, Localization, SyncedStorage} from "../../modulesCore";
import {SaveIndicator} from "./SaveIndicator";

class CustomLinks {

    static init() {

        this._container = document.querySelector(".js-customlinks");

        this._template = HTML.element(
            `<div class="custom-link option js-custom-link">
                <input type="checkbox" name="profile_custom_enabled">
                <div>
                    <div>
                        <label class="custom-link__label">${Localization.str.options.name}</label>
                        <input class="custom-link__input" type="text" name="profile_custom_name" maxlength="30">
                    </div>
                    <div>
                        <label class="custom-link__label">URL</label>
                        <input class="custom-link__input" type="text" name="profile_custom_url">
                    </div>
                    <div>
                        <label class="custom-link__label">${Localization.str.options.icon}</label>
                        <input class="custom-link__input" type="text" name="profile_custom_icon">
                    </div>
                </div>
                <button class="custom-link__close js-custom-link-remove"></button>
            </div>`
        );

        this._container.addEventListener("click", ({target}) => {
            if (!target.classList || !target.classList.contains("js-custom-link-remove")) { return; }
            target.closest(".js-custom-link").remove();
            CustomLinks._save();
        });

        this._container.addEventListener("change", ({target}) => {
            if (!target.closest(".js-custom-link")) { return; }
            CustomLinks._save();
        });

        document.querySelector(".js-custom-link-add").addEventListener("click", () => {
            CustomLinks._create(SyncedStorage.defaults.profile_custom_link[0]);
            CustomLinks._save();
        });
    }

    static populate() {
        HTML.inner(this._container, "");

        const links = SyncedStorage.get("profile_custom_link");
        for (const link of links) {
            CustomLinks._create(link);
        }
    }

    // TODO (KarlCastle?) Want to replace this with a CustomElement when the support is wider. CustomElements were added in FF63.
    static _create(link) {
        const node = this._template.cloneNode(true);

        let url = link.url;
        if (url && !url.includes("[ID]")) {
            url += "[ID]";
        }

        node.querySelector('[name="profile_custom_enabled"]').checked = link.enabled;
        node.querySelector('[name="profile_custom_name"]').value = link.name;
        node.querySelector('[name="profile_custom_url"]').value = url;
        node.querySelector('[name="profile_custom_icon"]').value = link.icon;

        this._container.append(node);
    }

    static _read(node) {
        return {
            "enabled": node.querySelector('[name="profile_custom_enabled"]').checked,
            "name": node.querySelector('[name="profile_custom_name"]').value,
            "url": node.querySelector('[name="profile_custom_url"]').value,
            "icon": node.querySelector('[name="profile_custom_icon"]').value,
        };
    }

    static _save() {
        const customLinks = document.querySelectorAll(".js-custom-link");
        const links = [];
        for (const row of customLinks) {
            const link = CustomLinks._read(row);
            if (!link.enabled && !link.name && !link.url && !link.icon) {
                continue;
            }
            links.push(link);
        }

        SyncedStorage.set("profile_custom_link", links);
        SaveIndicator.show();
    }
}

export {CustomLinks};
