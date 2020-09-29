/* eslint-disable no-alert -- TODO */

import {BackgroundBase, Downloader, ExtensionResources, HTML, Info, Language, Localization, SyncedStorage, sleep} from "core";
import {CountryList} from "options/countryList";
import {StoreList} from "options/storeList";

class Fader {

    static async applyCSSTransition(node, property, initialValue, finalValue, durationMs) {
        node.style.transition = "";
        node.style[property] = initialValue;

        await sleep(0);

        node.style.transition = `${property} ${durationMs}ms`;
        node.style[property] = finalValue;
    }

    static fadeIn(node, duration = 400) {
        return Fader.applyCSSTransition(node, "opacity", 0, 1, duration);
    }

    static async fadeOut(node, duration = 400) {
        await Fader.applyCSSTransition(node, "opacity", 1, 0, duration);
    }

    static async fadeInFadeOut(node, fadeInDuration = 400, fadeOutDuration = 400, idleDuration = 600) {
        const controlId = Date.now().toString();
        node.dataset.fadeControl = controlId;

        Fader.fadeIn(node, fadeInDuration);
        await sleep(fadeInDuration + idleDuration);

        if (node.dataset.fadeControl === controlId) {
            Fader.fadeOut(node, fadeOutDuration);
        }
    }
}

class SaveIndicator {

    static show() {
        const node = document.getElementById("saved");
        if (!node) { return; }

        Fader.fadeInFadeOut(node);
    }

}

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

class Sidebar {

    static _scrollTo(selector) {
        const node = document.querySelector(selector);
        if (!node) { return; }
        const topOffset = window.scrollY + node.getBoundingClientRect().top - 50;
        window.scrollTo({"top": topOffset, "left": 0, "behavior": "smooth"});
    }

    static _highlight(node) {
        const currentSelected = document.querySelector(".subentry.is-selected");

        if (!node.id) {
            if (currentSelected) {
                currentSelected.classList.remove(".is-selected");
            }
            return;
        }

        const sidebarEntry = document.querySelector(`.subentry[data-block-sel='#${node.id}']`);
        if (!sidebarEntry) { return; }

        if (currentSelected === sidebarEntry) {
            return;
        } else if (currentSelected) {
            currentSelected.classList.remove("is-selected");
        }

        sidebarEntry.classList.add("is-selected");

        const currentHighlight = document.querySelector(".content_section.is-highlighted");
        if (currentHighlight) {
            currentHighlight.classList.remove("is-highlighted");
        }
        node.classList.add("is-highlighted");
    }

    static _handleClick(e) {
        Sidebar._handleCategoryClick(e);
        Sidebar._handleSubentryClick(e);
    }

    static _handleCategoryClick(e) {
        const category = e.target.closest(".category.sidebar_entry");
        if (category === null) {
            return;
        }

        const row = category.closest(".tab_row");

        const contentNode = document.querySelector(row.dataset.blockSel);
        const selectedContent = document.querySelector(".content.selected");
        const newContent = contentNode.closest(".content");

        const hasSubentries = row.querySelector(".subentries");

        if (newContent !== selectedContent) {
            selectedContent.classList.remove("selected");

            const nodes = document.querySelectorAll(".tab_row.expanded");
            for (const node of nodes) {
                node.classList.remove("expanded");
            }

            newContent.classList.add("selected");

            // scroll only when changing content
            if (hasSubentries) {
                Sidebar._scrollTo(row.dataset.blockSel);
            } else {
                window.scrollTo(0, 0);
            }
        }

        const wasExpanded = row.classList.toggle("expanded", !row.classList.contains("expanded") || !hasSubentries);
        row.classList.toggle("collapsed", !wasExpanded);
    }

    static _handleSubentryClick(e) {

        const subentry = e.target.closest(".subentry");
        if (!subentry) { return; }

        const row = subentry.closest(".tab_row");
        if (!row) { return; }

        Sidebar._scrollTo(subentry.dataset.blockSel);
    }

    static _scrollHandler() {

        if (Sidebar._scrollTimeout) {
            return;
        }

        Sidebar._scrollTimeout = window.setTimeout(() => {
            Sidebar._scrollTimeout = null;

            for (const node of Sidebar._contentNodes) {
                const rect = node.getBoundingClientRect();

                if ((rect.top < 0 && rect.bottom > window.innerHeight) || rect.top > 0) {
                    Sidebar._highlight(node);
                    return;
                }
            }
        }, 100);
    }

    static create() {

        Sidebar._contentNodes = [];

        document.querySelectorAll(".tab_row").forEach(row => {

            const block = document.querySelector(row.dataset.blockSel);
            if (!block) {
                console.warn("Missing data-block-sel attribute on sidebar entry");
                return;
            }

            // Only create subentries for the settings
            const sections = block.querySelectorAll(".settings .content_section");
            if (sections.length === 0) { return; }

            row.classList.add(row.classList.contains("selected") ? "expanded" : "collapsed");

            HTML.beforeEnd(row.firstElementChild, '<div class="category__triangle">&#9664;</div>');

            let subentries = "";
            sections.forEach(section => {
                subentries
                    += `<li class="sidebar_entry subentry" data-block-sel="#${section.id}">
                        ${section.firstElementChild.textContent}
                    </li>`;
                Sidebar._contentNodes.push(section);
            });
            HTML.beforeEnd(row, `<ul class="subentries">${subentries}</ul>`);
        });

        document.querySelector("#side_bar").addEventListener("click", Sidebar._handleClick);
        document.addEventListener("scroll", Sidebar._scrollHandler);
        Sidebar._scrollHandler();
    }

}


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
        SaveIndicator.show();
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

        const html = `<div class="country_parent js-region-parent">
                <span class='es-flag ${countryClass}'></span>
                <select class='regional_country js-region'>${options}</select>
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

const Options = (() => {
    const self = {};

    const profileLinkImagesSelect = document.getElementById("profile_link_images_dropdown");

    function loadStores() {
        const cols = 4;
        const storesNode = document.getElementById("store_stores");
        const stores = SyncedStorage.get("stores");

        const perCol = Math.ceil(StoreList.length / cols);

        let html = "";
        let i = 0;
        for (let c = 0; c < cols; c++) {
            html += "<div class='store_col'>";
            for (let len = Math.min(StoreList.length, (c + 1) * perCol); i < len; ++i) {
                const id = StoreList[i].id;
                html
                    += `<div class="option">
                        <input type="checkbox" id="${id}"${(stores.length === 0 || stores.indexOf(id) !== -1) ? " checked" : ""}>
                        <label for="${id}">${StoreList[i].title}</label>
                    </div>`;
            }
            html += "</div>";
        }

        HTML.inner(storesNode, html);
    }

    async function loadTranslation() {

        function deepCount(obj) {
            let cnt = 0;
            for (const key of Object.keys(obj)) {
                if (!Localization.str[key]) { // don't count "made up" translations
                    continue;
                }
                if (typeof obj[key] === "object") {
                    cnt += deepCount(obj[key]);
                } else if (obj[key] !== "") {
                    cnt++;
                }
            }
            return cnt;
        }

        const [itadStatus, itadAction] = document.querySelectorAll("#itad_status, #itad_action");

        async function disconnect() {
            await BackgroundBase.action("itad.disconnect");

            itadStatus.textContent = Localization.str.disconnected;
            itadStatus.classList.add("disconnected");
            itadStatus.classList.remove("connected");

            itadAction.textContent = Localization.str.connect;
            itadAction.removeEventListener("click", disconnect);
            itadAction.addEventListener("click", connect); // eslint-disable-line no-use-before-define -- Circular dependency
        }

        async function connect() {

            // Has to be synchronously acquired from a user gesture
            if (!await browser.permissions.request({"permissions": ["webRequest", "webRequestBlocking"]})) { return; }
            await BackgroundBase.action("itad.authorize");

            itadStatus.textContent = Localization.str.connected;
            itadStatus.classList.add("connected");
            itadStatus.classList.remove("disconnected");

            itadAction.textContent = Localization.str.disconnect;
            itadAction.removeEventListener("click", connect);
            itadAction.addEventListener("click", disconnect);
        }

        // When locale files are loaded changed text on page accordingly
        await Localization;

        document.title = `Augmented Steam ${Localization.str.thewordoptions}`;

        // Localize elements with text
        let nodes = document.querySelectorAll("[data-locale-text]");
        for (const node of nodes) {
            let translation = Localization.getString(node.dataset.localeText);
            if (node.dataset.localeText.startsWith("options.context_")) {
                translation = translation.replace("__query__", "...");
            }
            if (translation) {
                node.textContent = translation;
            } else {
                console.warn(`Missing translation ${node.dataset.localeText}`);
            }
        }

        nodes = document.querySelectorAll("[data-locale-html]");
        for (const node of nodes) {
            const translation = Localization.getString(node.dataset.localeHtml);
            if (translation) {
                HTML.inner(node, translation);
            } else {
                console.warn(`Missing translation ${node.dataset.localeHtml}`);
            }
        }

        nodes = document.querySelectorAll("#warning_language option");
        for (const node of nodes) {
            const lang = node.textContent;
            const langTrl = Localization.str.options.lang[node.value.toLowerCase()];
            if (lang !== langTrl) {
                node.textContent = `${lang} (${langTrl})`;
            }
        }

        const total = deepCount(Localization.str);
        for (const lang of Object.keys(Localization.str.options.lang)) {
            const node = document.querySelector(`.language.${lang}`);
            if (node) {
                node.textContent = `${Localization.str.options.lang[lang]}:`;
            }

            if (lang === "english") { continue; }
            const code = Language.languages[lang];
            const locale = await Localization.loadLocalization(code);
            const count = deepCount(locale);
            const percentage = 100 * count / total;

            HTML.inner(document.querySelector(`.lang-perc.${lang}`), `${percentage.toFixed(1)}%&nbsp;`);
        }

        if (await BackgroundBase.action("itad.isconnected")) {
            itadStatus.textContent = Localization.str.connected;
            itadStatus.classList.add("connected");

            itadAction.textContent = Localization.str.disconnect;
            itadAction.addEventListener("click", disconnect);
        } else {
            itadStatus.textContent = Localization.str.disconnected;
            itadStatus.classList.add("disconnected");

            itadAction.textContent = Localization.str.connect;
            itadAction.addEventListener("click", connect);
        }
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
                    if (node.id === "stores_all") { value = !value; }

                    let nxt = parentOption.nextElementSibling;
                    for (; nxt.classList.contains("sub_option"); nxt = nxt.nextElementSibling) {
                        nxt.classList.toggle("disabled", !value);
                    }
                }
            } else if (value) {
                node.value = value;
            }
        }

        if (SyncedStorage.get("showregionalprice")) {
            document.getElementById("region_selects").style.display = "block";
        }
        if (SyncedStorage.get("showregionalprice") !== "mouse") {
            document.getElementById("regional_price_hideworld").style.display = "block";
        }

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

                window.alert(Localization.str.options.settings_mngmt.import_fail);
                return;
            }

            window.alert(Localization.str.options.settings_mngmt.import_success);
            window.location.reload();
        });
        reader.readAsText(input.files[0]);
    }

    function exportSettings() {
        Downloader.download(new Blob([JSON.stringify(SyncedStorage.cache)]), `AugmentedSteam_v${Info.version}.json`);
    }

    function clearSettings() {
        if (!confirm(Localization.str.options.clear)) { return; }
        SyncedStorage.clear();

        for (const el of document.querySelectorAll(".custom-link__close")) {
            el.click();
        }

        SyncedStorage.then(loadOptions);

        const node = document.getElementById("reset_note");
        if (node) {
            Fader.fadeInFadeOut(node);
        }
    }

    function saveOption(option) {
        let value;

        if (option === "stores") {

            value = [];
            const nodes = document.querySelectorAll("#store_stores input[type=checkbox]");
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
        }

        SyncedStorage.set(option, value);
        SaveIndicator.show();
    }

    function saveOptionFromEvent(e) {
        if (!e.target || !e.target.closest) { return; } // "blur" fires when the window loses focus
        const node = e.target.closest("[data-setting]");
        if (!node) {
            if (e.target.closest("#store_stores")) {
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

        loadOptions();
        loadTranslation().then(Sidebar.create);

        document.getElementById("profile_link_images_dropdown").addEventListener("change", loadProfileLinkImages);

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

        document.getElementById("regional_price_on").addEventListener("change", e => {
            const node = e.target.closest("#regional_price_on");

            document.getElementById("region_selects").style.display = node.value === "off" ? "none" : "block";
            document.getElementById("regional_price_hideworld").style.display = node.value === "mouse" ? "flex" : "none";
        });

        document.querySelectorAll(".parent_option").forEach(parentOption => {
            parentOption.querySelector("input").addEventListener("change", () => {
                let nxt = parentOption.nextElementSibling;
                for (; nxt.classList.contains("sub_option"); nxt = nxt.nextElementSibling) {
                    nxt.classList.toggle("disabled");
                }
            });
        });

        const importInput = document.getElementById("import_input");

        importInput.addEventListener("change", importSettings, false);
        document.getElementById("import").addEventListener("click", () => { importInput.click(); });
        document.getElementById("export").addEventListener("click", exportSettings);
        document.getElementById("reset").addEventListener("click", clearSettings);

        document.addEventListener("change", saveOptionFromEvent);
        document.addEventListener("blur", saveOptionFromEvent);
        document.addEventListener("select", saveOptionFromEvent);
    };

    return self;
})();

document.addEventListener("DOMContentLoaded", Options.init);

// add correct version of styles based on browser
(() => {
    const manifest = browser.runtime.getManifest();

    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.type = "text/css";

    if (manifest.browser_specific_settings) { // we only include this in firefox manifest
        linkEl.href = "../css/enhancedsteam-firefox.css";
    } else {
        linkEl.href = "../css/enhancedsteam-chrome.css";
    }
    document.head.appendChild(linkEl);

})();
