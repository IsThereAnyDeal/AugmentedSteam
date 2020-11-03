import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {SaveIndicator} from "./SaveIndicator";

class CustomLinks {

    static init() {
        const links = SyncedStorage.get("profile_custom_link");
        for (const link of links) {
            CustomLinks.show(link);
        }
    }

    // TODO (KarlCastle?) Want to replace this with a CustomElement when the support is wider. CustomElements were added in FF63.
    static show(link) {
        const customLinkTemplate = document.getElementById("add_custom_profile_link");
        let node = document.importNode(customLinkTemplate.content, true).firstElementChild;

        let url = link.url;
        if (url && !url.includes("[ID]")) {
            url += "[ID]";
        }
        node.querySelector('[name="profile_custom_enabled"]').checked = link.enabled;
        node.querySelector('[name="profile_custom_name"]').value = link.name;
        node.querySelector('[name="profile_custom_url"]').value = url;
        node.querySelector('[name="profile_custom_icon"]').value = link.icon;

        const insertionPoint = document.getElementById("add-custom-link").closest("div");
        node = insertionPoint.insertAdjacentElement("beforebegin", node);

        node.addEventListener("change", CustomLinks.save);
        node.querySelector(".js-custom-link-remove")
            .addEventListener("click", CustomLinks.remove, false);
    }

    static create(link) {
        CustomLinks.show(link);
        CustomLinks.save();
    }

    static read(node) {
        return {
            "enabled": node.querySelector('[name="profile_custom_enabled"]').checked,
            "name": node.querySelector('[name="profile_custom_name"]').value,
            "url": node.querySelector('[name="profile_custom_url"]').value,
            "icon": node.querySelector('[name="profile_custom_icon"]').value,
        };
    }

    static save() {
        const customLinks = document.querySelectorAll(".js-custom-link");
        const links = [];
        for (const row of customLinks) {
            const link = CustomLinks.read(row);
            if (!link.enabled && !link.name && !link.url && !link.icon) {
                continue;
            }
            links.push(link);
        }

        SyncedStorage.set("profile_custom_link", links);
        SaveIndicator.show();
    }

    static remove(ev) {
        if (!ev.target || !(ev.target instanceof Element)) { return; }

        let row = ev.target.closest(".js-custom-link");
        if (row) {
            row.remove();
            row = null;
        }

        CustomLinks.save();
    }

}

export {CustomLinks};
