import {CustomLinks} from "../Modules/Options/CustomLinks";
import {Fader} from "../Modules/Options/Fader";
import {Region} from "../Modules/Options/Region";
import {SaveIndicator} from "../Modules/Options/SaveIndicator";
import {Sidebar} from "../Modules/Options/Sidebar";
import {
    BackgroundSimple, Downloader, ExtensionResources, HTML, Info, Language,
    Localization, Permissions, SyncedStorage
} from "../modulesCore";
import {StoreList} from "../Modules/Options/Data/StoreList";

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
            await BackgroundSimple.action("itad.disconnect");

            itadStatus.textContent = Localization.str.disconnected;
            itadStatus.classList.add("disconnected");
            itadStatus.classList.remove("connected");

            itadAction.textContent = Localization.str.connect;
            itadAction.removeEventListener("click", disconnect);
            itadAction.addEventListener("click", connect); // eslint-disable-line no-use-before-define -- Circular dependency
        }

        async function connect() {

            // Has to be synchronously acquired from a user gesture
            if (!await Permissions.request("itad_connect")) { return; }
            await BackgroundSimple.action("itad.authorize");
            await Permissions.remove("itad_connect");

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

        if (await BackgroundSimple.action("itad.isconnected")) {
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

        const node = document.getElementById("reset_note");
        if (node) {
            Fader.fadeInFadeOut(node);
        }
    }

    async function saveOption(option) {
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

            const permKey = `opt_${option}`;

            if (Permissions.containsKey(permKey)) {
                try {
                    let success;
                    if (value) {
                        success = await Permissions.request(permKey);
                    } else {
                        success = await Permissions.remove(permKey);
                    }

                    if (!success) {
                        throw new Error("Could not grant / remove the permissions");
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
