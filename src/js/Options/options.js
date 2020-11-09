import {CustomLinks} from "./Modules/CustomLinks";
import {Fader} from "./Modules/Fader";
import {ITADConnectionManager} from "./Modules/ITADConnectionManager";
import {LocaleCreditsBuilder} from "./Modules/LocaleCreditsBuilder";
import {OptionsBuilder} from "./Modules/OptionsBuilder";
import {OptionsTranslator} from "./Modules/OptionsTranslator";
import {Region} from "./Modules/Region";
import {SaveIndicator} from "./Modules/SaveIndicator";
import {Sidebar} from "./Modules/Sidebar";
import {
    Downloader, ExtensionResources, HTML, Info,
    Localization, PermissionOptions, Permissions, SyncedStorage
} from "../modulesCore";
import {StoreList} from "./Modules/Data/StoreList";
import {ContextMenu} from "../Background/Modules/ContextMenu";

// TODO this needs to be refactored and cleaned up

const Options = (() => {
    const self = {};

    let profileLinkImagesSelect;

    function loadStores() {
        const storesNode = document.querySelector(".js-store-stores");
        const stores = SyncedStorage.get("stores");

        let html = "";

        for (const store of StoreList) {
            const id = store.id;
            html += `<div class="option option--store">
                        <input type="checkbox" id="${id}"${(stores.length === 0 || stores.indexOf(id) !== -1) ? " checked" : ""}>
                        <label for="${id}">${store.title}</label>
                    </div>`;
        }

        HTML.inner(storesNode, html);
    }

    function loadProfileLinkImages() {

        const icons = document.querySelectorAll(".es_sites_icons");
        switch (profileLinkImagesSelect.value) {
            case "color": {
                icons.forEach(icon => {
                    icon.classList.toggle("es_gray", false);
                    icon.style.display = "";
                });
                break;
            }
            case "gray": {
                icons.forEach(icon => {
                    icon.classList.toggle("es_gray", true);
                    icon.style.display = "";
                });
                break;
            }
            case "none": {
                icons.forEach(icon => { icon.style.display = "none"; });
            }
        }
    }

    // Restores select box state to saved value from SyncStorage.
    let changelogLoaded;

    function loadOptions() {

        CustomLinks.init();

        // Set the value or state for each input
        const nodes = document.querySelectorAll("[data-setting]");
        for (const node of nodes) {
            const setting = node.dataset.setting;
            let value = SyncedStorage.get(setting);

            if (node.type && node.type === "checkbox") {
                node.checked = value;

                const parentOption = node.closest(".parent_option");
                if (parentOption) {
                    if (node.id === "showallstores") { value = !value; }

                    let nxt = parentOption.nextElementSibling;
                    for (; nxt.classList.contains("js-sub-option"); nxt = nxt.nextElementSibling) {
                        nxt.classList.toggle("is-disabled", !value);
                    }
                }
            } else if (value) {
                node.value = value;
            }
        }

        document.querySelector(".js-region-select")
            .classList.toggle("is-hidden", SyncedStorage.get("showregionalprice") === "off");

        document.querySelector(".js-region-world")
            .classList.toggle("is-hidden", SyncedStorage.get("showregionalprice") !== "mouse");

        const language = SyncedStorage.get("language");
        if (language !== "schinese" && language !== "tchinese") {
            const n = document.getElementById("profile_steamrepcn");
            if (n) {

                // Hide SteamRepCN option if language isn't Chinese
                n.parentNode.style.display = "none";
            }
        }

        if (!changelogLoaded) {
            ExtensionResources.getText("changelog.txt")
                .then(data => {
                    HTML.inner(
                        document.getElementById("changelog_text"),
                        data.replace(/\n/g, "\n<br>")
                    );
                });
            changelogLoaded = true;
        }

        loadProfileLinkImages();
        loadStores();

        Region.populate();
    }

    function importSettings({"target": input}) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            let importedSettings;
            try {
                importedSettings = JSON.parse(reader.result);
            } catch (err) {
                console.group("Import");
                console.error("Failed to read settings file");
                console.error(err);
                console.groupEnd();

                // TODO do not use alert
                // eslint-disable-next-line no-alert
                window.alert(Localization.str.options.settings_mngmt.import_fail);
                return;
            }

            delete importedSettings.version;

            try {
                SyncedStorage.import(importedSettings);
            } catch (err) {
                console.group("Import");
                console.error("Failed to write settings to storage");
                console.error(err);
                console.groupEnd();

                // TODO do not use alert
                // eslint-disable-next-line no-alert
                window.alert(Localization.str.options.settings_mngmt.import_fail);
                return;
            }

            // TODO do not use alert
            // eslint-disable-next-line no-alert
            window.alert(Localization.str.options.settings_mngmt.import_success);
            window.location.reload();
        });
        reader.readAsText(input.files[0]);
    }

    function exportSettings() {
        Downloader.download(new Blob([SyncedStorage.toJson()]), `AugmentedSteam_v${Info.version}.json`);
    }

    function clearSettings() {
        // TODO do not use confirm
        // eslint-disable-next-line no-alert
        if (!window.confirm(Localization.str.options.clear)) { return; }
        SyncedStorage.clear();

        for (const el of document.querySelectorAll(".custom-link__close")) {
            el.click();
        }

        SyncedStorage.then(loadOptions);

        const node = document.querySelector(".js-options-reset");
        if (node) {
            Fader.fadeInFadeOut(node);
        }
    }

    async function saveOption(option) {
        let value;

        if (option === "stores") {

            value = [];
            const nodes = document.querySelectorAll(".js-store-stores input[type=checkbox]");
            for (const node of nodes) {
                if (node.checked) {
                    value.push(node.id);
                }
            }

        } else {

            const node = document.querySelector(`[data-setting='${option}']`);
            if (!node) { return; }

            if (node.type && node.type === "checkbox") {
                value = node.checked;
            } else {
                value = node.value;
            }

            if (option === "quickinv_diff") {
                value = parseFloat(value.trim()).toFixed(2);
            }

            if (PermissionOptions[option]) {
                try {
                    let success;
                    if (value) {
                        success = await Permissions.requestOption(option);
                    } else {
                        success = await Permissions.removeOption(option);
                    }

                    if (!success) {
                        throw new Error("Could not grant / remove the permissions");
                    }

                    if (PermissionOptions[option].permissions.includes("contextMenus")) {
                        ContextMenu.update();
                    }
                } catch (err) {
                    console.error(err);

                    // Don't save option
                    if (node.type && node.type === "checkbox") {
                        node.checked = !value;
                    }
                    return;
                }
            }
        }

        SyncedStorage.set(option, value);
        SaveIndicator.show();
    }

    function saveOptionFromEvent(e) {
        if (!e.target || !e.target.closest) { return; } // "blur" fires when the window loses focus
        const node = e.target.closest("[data-setting]");
        if (!node) {
            if (e.target.closest(".js-store-stores")) {
                saveOption("stores");
            }
            return;
        }
        saveOption(node.dataset.setting);
    }

    function setValue(selector, value) {
        const node = document.querySelector(selector);
        node.value = value;
        const setting = node.closest("[data-setting]");
        if (setting) {
            saveOption(setting.dataset.setting);
        }
    }

    function addCurrencies(currencies) {
        const select = document.getElementById("override_price");

        currencies
            .map(cu => cu.abbr)
            .filter(cu => cu !== "USD") // already in HTML
            .sort()
            .forEach(currency => {
                const el = document.createElement("option");
                el.value = currency;
                el.innerText = currency;
                select.appendChild(el);
            });
    }

    self.init = async() => {
        const settings = SyncedStorage.init();
        const currency = ExtensionResources.getJSON("json/currency.json").then(addCurrencies);
        await Promise.all([settings, currency]);
        const Defaults = SyncedStorage.defaults;

        Region.init();

        await Localization;

        OptionsBuilder.build();

        profileLinkImagesSelect = document.querySelector("select[data-setting='show_profile_link_images']");
        profileLinkImagesSelect.addEventListener("change", loadProfileLinkImages);

        loadOptions();

        await OptionsTranslator.translate();
        Sidebar.create();

        await (new ITADConnectionManager()).run();

        (new LocaleCreditsBuilder()).build();

        function addHandlerToSetDefaultColor(key) {
            document.getElementById(`${key}_default`)
                .addEventListener("click", () => { setValue(`#${key}_color`, Defaults[`${key}_color`]); });
        }

        ["highlight_owned",
            "highlight_wishlist",
            "highlight_coupon",
            "highlight_inv_gift",
            "highlight_inv_guestpass",
            "highlight_notinterested",
            "highlight_waitlist",
            "highlight_collection",
            "tag_owned",
            "tag_wishlist",
            "tag_coupon",
            "tag_inv_gift",
            "tag_inv_guestpass",
            "tag_notinterested",
            "tag_collection",
            "tag_waitlist"].forEach(addHandlerToSetDefaultColor);

        document.getElementById("spamcommentregex_default")
            .addEventListener("click", () => setValue("#spamcommentregex", "[\\u2500-\\u25FF]"));
        document.getElementById("quickinv_default")
            .addEventListener("click", () => setValue("#quickinv_diff", "-0.01"));

        document.getElementById("quickinv_diff").addEventListener("blur", () => {
            if (isNaN(parseFloat(document.getElementById("quickinv_diff").value))) {
                setValue("#quickinv_diff", "-0.01");
            }
        });

        document.getElementById("add-custom-link").addEventListener("click", () => {
            CustomLinks.create(SyncedStorage.defaults.profile_custom_link[0]);
        });

        document.querySelector("select[data-setting='showregionalprice']").addEventListener("change", e => {
            const node = e.target;

            document.querySelector(".js-region-select")
                .classList.toggle("is-hidden", node.value === "off");
            document.querySelector(".js-region-world")
                .classList.toggle("is-hidden", node.value !== "mouse");
        });

        document.querySelectorAll(".parent_option").forEach(parentOption => {
            parentOption.querySelector("input").addEventListener("change", () => {
                let nxt = parentOption.nextElementSibling;
                for (; nxt.classList.contains("js-sub-option"); nxt = nxt.nextElementSibling) {
                    nxt.classList.toggle("is-disabled");
                }
            });
        });

        const importInput = document.getElementById("import_input");

        importInput.addEventListener("change", importSettings, false);
        document.getElementById("import").addEventListener("click", () => { importInput.click(); });
        document.getElementById("export").addEventListener("click", exportSettings);
        document.querySelector(".js-reset").addEventListener("click", clearSettings);

        document.addEventListener("change", saveOptionFromEvent);
        document.addEventListener("blur", saveOptionFromEvent);
        document.addEventListener("select", saveOptionFromEvent);
    };

    return self;
})();

document.addEventListener("DOMContentLoaded", Options.init);
