
class SaveIndicator {

    static show() {
        let node = document.getElementById('saved');
        if (!node) { return; }

        Fader.fadeInFadeOut(node);
    }

}

class Fader {

    static async applyCSSTransition(node, property, initialValue, finalValue, durationMs) {
        node.style.transition = '';
        node.style[property] = initialValue;

        await sleep(0);

        node.style.transition = `${property} ${durationMs}ms`;
        node.style[property] = finalValue;
    }

    static async fadeIn(node, duration = 400) {
        return Fader.applyCSSTransition(node, 'opacity', 0, 1, duration);
    }

    static async fadeOut(node, duration = 400) {
        await Fader.applyCSSTransition(node, 'opacity', 1, 0, duration);
    }

    static async fadeInFadeOut(node, fadeInDuration = 400, fadeOutDuration = 400, idleDuration = 600) {
        let controlId = Date.now().toString();
        node.dataset.fadeControl = controlId;

        Fader.fadeIn(node, fadeInDuration);
        await sleep(fadeInDuration + idleDuration);

        if (node.dataset.fadeControl === controlId) {
            Fader.fadeOut(node, fadeOutDuration);
        }
    }
}


class CustomLinks {

    static init() {

        let links = SyncedStorage.get('profile_custom_link');
        for (let link of links) {
            CustomLinks.show(link);
        }

        document
            .querySelector("#add-custom-link")
            .addEventListener("click", function() {
                CustomLinks.create(SyncedStorage.defaults.profile_custom_link[0]);
            });
    }

    // TODO (KarlCastle?) Want to replace this with a CustomElement when the support is wider. CustomElements were added in FF63.
    static show(link) {
        let customLinkTemplate = document.getElementById('add_custom_profile_link');
        let node = document.importNode(customLinkTemplate.content, true).firstElementChild;

        let url = link.url;
        if (url && !url.includes("[ID]")) {
            url += "[ID]";
        }
        node.querySelector(`[name="profile_custom_enabled"]`).checked = link.enabled;
        node.querySelector(`[name="profile_custom_name"]`).value = link.name;
        node.querySelector(`[name="profile_custom_url"]`).value = url;
        node.querySelector(`[name="profile_custom_icon"]`).value = link.icon;

        let insertionPoint = document.getElementById('add-custom-link').closest('div');
        node = insertionPoint.insertAdjacentElement('beforebegin', node);

        node.addEventListener('change', CustomLinks.save);
        node.querySelector('.custom-link__close[name="profile_custom_remove"]')
            .addEventListener('click', CustomLinks.remove, false);
    }

    static create(link) {
        CustomLinks.show(link);
        CustomLinks.save();
    }

    static read(node) {
        return {
            'enabled': node.querySelector(`[name="profile_custom_enabled"]`).checked,
            'name': node.querySelector(`[name="profile_custom_name"]`).value,
            'url': node.querySelector(`[name="profile_custom_url"]`).value,
            'icon': node.querySelector(`[name="profile_custom_icon"]`).value,
        };
    }

    static save() {
        let customLinks = document.querySelectorAll('.custom-link');
        let links = [];
        for (let row of customLinks) {
            let link = CustomLinks.read(row);
            if (!link.enabled && !link.name && !link.url && !link.icon) {
                continue;
            }
            links.push(link);
        }

        SyncedStorage.set('profile_custom_link', links);
        SaveIndicator.show();
    }

    static remove(ev) {
        if (!ev.target || !(ev.target instanceof Element)) { return; }
        //if (!ev.target.matches('.close_button')) { return; }

        let row = ev.target.closest('.custom-link');
        if (row) {
            row.remove();
            row = null;
        }

        CustomLinks.save();
    }

}

class Sidebar {

    static _scrollTo(selector) {
        let node = document.querySelector(selector);
        if (!node) { return; }
        let topOffset = window.scrollY + node.getBoundingClientRect().top - 50;
        window.scrollTo({top: topOffset, left: 0, behavior: "smooth"});
    }

    static _highlight(node) {
        let currentSelected = document.querySelector(".subentry.is-selected");

        if (!node.id) {
            if (currentSelected) {
                currentSelected.classList.remove(".is-selected");
            }
            return;
        }
        
        let sidebarEntry = document.querySelector(`.subentry[data-block-sel='#${node.id}']`);
        if (!sidebarEntry) { return; }

        if (currentSelected === sidebarEntry) {
            return;
        } else if (currentSelected) {
            currentSelected.classList.remove("is-selected");
        }

        sidebarEntry.classList.add("is-selected");

        let currentHighlight = document.querySelector(".content_section.is-highlighted");
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
        let category = e.target.closest(".category.sidebar_entry");
        if (category == null) {
            return;
        }

        let row = category.closest(".tab_row");

        let contentNode = document.querySelector(row.dataset.blockSel);
        let selectedContent = document.querySelector(".content.selected");
        let newContent = contentNode.closest(".content");

        let hasSubentries = row.querySelector(".subentries");

        if (newContent !== selectedContent) {
            selectedContent.classList.remove("selected");
            
            let nodes = document.querySelectorAll(".tab_row.expanded");
            for (let node of nodes) {
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

        let wasExpanded = row.classList.toggle("expanded", !row.classList.contains("expanded") || !hasSubentries);
        row.classList.toggle("collapsed", !wasExpanded);
    }

    static _handleSubentryClick(e) {

        let subentry = e.target.closest(".subentry");
        if (!subentry) { return; }

        let row = subentry.closest(".tab_row");
        if (!row) { return; }

        Sidebar._scrollTo(subentry.dataset.blockSel);
    }

    static _scrollHandler() {

        if (Sidebar._scrollTimeout) {
            return;
        }

        Sidebar._scrollTimeout = window.setTimeout(() => {
            Sidebar._scrollTimeout = null;

            for (let node of Sidebar._contentNodes) {
                let rect = node.getBoundingClientRect();

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

            let block = document.querySelector(row.dataset.blockSel);
            if (!block) {
                console.warn("Missing data-block-sel attribute on sidebar entry");
                return;
            }

            // Only create subentries for the settings
            let sections = block.querySelectorAll(".settings .content_section");
            if (sections.length === 0) return;

            row.classList.add(row.classList.contains("selected") ? "expanded" : "collapsed");

            HTML.beforeEnd(row.firstElementChild, `<div class="category__triangle">&#9664;</div>`);

            let subentries = "";
            sections.forEach(section => {
                subentries +=`<li class="sidebar_entry subentry" data-block-sel="#${section.id}">${section.firstElementChild.textContent}</li>`;
                Sidebar._contentNodes.push(section);
            });
            HTML.beforeEnd(row, `<ul class="subentries">${subentries}</ul>`);
        });

        document.querySelector("#side_bar").addEventListener("click", Sidebar._handleClick);
        document.addEventListener("scroll", Sidebar._scrollHandler);
        Sidebar._scrollHandler();
    }

}

let Options = (function(){
    let self = {};

    let profileLinkImagesSelect = document.getElementById("profile_link_images_dropdown");

    function loadStores() {
        let cols = 4;
        let stores_node = document.getElementById("store_stores");
        let stores = SyncedStorage.get("stores");

        let perCol = Math.ceil(StoreList.length / cols);

        let html = "";
        let i = 0;
        for (let c=0; c<cols; c++) {
            html += "<div class='store_col'>";
            for (let len = Math.min(StoreList.length, (c+1) * perCol); i < len; ++i) {
                let id = StoreList[i].id;
                html += `<div class="option"><input type="checkbox" id="${id}"${(stores.length === 0 || stores.indexOf(id) !== -1) ? " checked" : ''}><label for="${id}">${StoreList[i].title}</label></div>`;
            }
            html += "</div>";
        }

        HTML.inner(stores_node, html);
    }

    function loadTranslation() {
        // When locale files are loaded changed text on page accordingly
        return Localization.then(async () => {
            document.title = "Augmented Steam " + Localization.str.thewordoptions;

            // Localize elements with text
            let nodes = document.querySelectorAll("[data-locale-text]");
            for (let node of nodes) {
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
            for (let node of nodes) {
                let translation = Localization.getString(node.dataset.localeHtml);
                if (translation) {
                    HTML.inner(node, translation);
                } else {
                    console.warn(`Missing translation ${node.dataset.localeHtml}`);
                }
            }

            nodes = document.querySelectorAll("#warning_language option");
            for (let node of nodes) {
                let lang = node.textContent;
                let lang_trl = Localization.str.options.lang[node.value.toLowerCase()];
                if (lang !== lang_trl) {
                    node.textContent = `${lang} (${lang_trl})`;
                }
            }

            let total = deepCount(Localization.str);
            for (let lang of Object.keys(Localization.str.options.lang)) {
                let node = document.querySelector(`.language.${lang}`);
                if (node) {
                    node.textContent = `${Localization.str.options.lang[lang]}:`;
                }

                if (lang === "english") continue;
                let code = Language.languages[lang];
                let locale = await Localization.loadLocalization(code);
                let count = deepCount(locale);
                let percentage = 100 * count / total;

                HTML.inner(
                    document.querySelector(`.lang-perc.${lang}`),
                    `<a href="https://github.com/tfedor/AugmentedSteam/edit/develop/localization/${code}/strings.json">${percentage.toFixed(1)}%</a>`
                );
            }

            function deepCount(obj) {
                let cnt = 0;
                for (let key in obj) {
                    if (!Localization.str[key]) { // don't count "made up" translations
                        continue;
                    }
                    if (typeof obj[key] === "object") {
                        cnt += deepCount(obj[key]);
                    } else {
                        cnt += 1;
                    }
                }
                return cnt;
            }
        });
    }

    let Region = (function() {

        function generateRegionSelect(country) {
            let options = "";
            for (let cc in CountryList) {
                let selected = (cc.toLowerCase() == country ? " selected='selected'" : "");
                options += `<option value='${cc.toLowerCase()}'${selected}>${CountryList[cc]}</option>`;
            }

            let countryClass = "";
            if (country) {
                countryClass = `es_flag_${country}`;
            }

            return `<div class="country_parent">
                <span class='es_flag ${countryClass}'></span>
                <select class='regional_country'>${options}</select>
                <button type="button" class="custom-link__close"></button>
            </div>`;
        }

        self.populateRegionalSelects = function() {
            let addAnotherWrapper = document.querySelector("#add_another_region").parentNode;
            let countries = SyncedStorage.get("regional_countries");
            countries.forEach(country => {
                HTML.beforeBegin(addAnotherWrapper, generateRegionSelect(country));
                addAnotherWrapper.previousSibling.querySelector(".custom-link__close").addEventListener("click", e => {
                    let select = e.target.closest(".country_parent").querySelector(".regional_country");
                    select.value = "";
                    saveOption("regional_countries");
                }, false);
            });
        };

        self.addRegionSelector = function () {
            let addAnotherWrapper = document.querySelector("#add_another_region").parentNode;
            HTML.beforeBegin(addAnotherWrapper, generateRegionSelect());
            addAnotherWrapper.previousSibling.querySelector(".custom-link__close").addEventListener("click", e => {
                let select = e.target.closest(".country_parent").querySelector(".regional_country");
                select.value = "";
                saveOption("regional_countries");
            }, false);
        };

        return self;
    })();

    function loadProfileLinkImages() {

        let icons = document.querySelectorAll(".es_sites_icons");
        switch (profileLinkImagesSelect.value) {
            case "color": {
                icons.forEach(icon => {
                    icon.classList.toggle("es_gray", false);
                    icon.style.display = '';
                });
                break;
            }
            case "gray": {
                icons.forEach(icon => {
                    icon.classList.toggle("es_gray", true);
                    icon.style.display = '';
                });
                break;
            }
            case "none": {
                icons.forEach(icon => icon.style.display = "none");
            }
        }
    }

    // Restores select box state to saved value from SyncStorage.
    let changelogLoaded;

    function loadOptions() {

        CustomLinks.init();

        // Set the value or state for each input
        nodes = document.querySelectorAll("[data-setting]");
        for (let node of nodes) {
            let setting = node.dataset.setting;
            let value = SyncedStorage.get(setting);

            if (node.type && node.type === "checkbox") {
                node.checked = value;

                let parentOption = node.closest(".parent_option");
                if (parentOption) {
                    if (node.id === "stores_all") value = !value;
                    for (let nextSibling = parentOption.nextElementSibling; nextSibling.classList.contains("sub_option"); nextSibling = nextSibling.nextElementSibling) {
                        nextSibling.classList.toggle("disabled", !value);
                    }
                }
            } else {
                if (value) {
                    node.value = value;
               }
            }
        }

        if (SyncedStorage.get("showregionalprice")) {
            document.getElementById("region_selects").style.display = "block";
        }
        if (SyncedStorage.get("showregionalprice") !== "mouse") {
            document.getElementById("regional_price_hideworld").style.display = "block";
        }

        let language = SyncedStorage.get("language");
        if (language !== "schinese" && language !== "tchinese") {
            let n = document.getElementById('profile_steamrepcn');
            if (n) {
                // Hide SteamRepCN option if language isn't Chinese
                n.parentNode.style.display = 'none';
            }
        }

        Region.populateRegionalSelects();

        if (!changelogLoaded) {
            ExtensionResources.getText('changelog.txt')
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
    }


    function clearSettings() {
        if (!confirm(Localization.str.options.clear)) { return; }
        SyncedStorage.clear();

        for (let el of document.querySelectorAll(".country_parent")) {
            el.remove();
        }

        for (let el of document.querySelectorAll(".custom-link__close")) {
            el.click();
        }

        SyncedStorage.then(loadOptions);

        let node = document.getElementById('reset_note');
        if (node) {
            Fader.fadeInFadeOut(node);
        }
    }

    function loadDefaultCountries() {
        SyncedStorage.remove("regional_countries");

        let nodes = document.querySelectorAll("#region_selects div.country_parent");
        for (let node of nodes) {
            node.remove();
        }

        Region.populateRegionalSelects();

        SaveIndicator.show();
    }

    function saveOptionFromEvent(e) {
        if (!e.target || !e.target.closest) return; // "blur" fires when the window loses focus
        let node = e.target.closest("[data-setting]");
        if (!node) {
            if (e.target.closest("#store_stores")) {
                saveOption("stores");
            }
            return;
        }
        saveOption(node.dataset.setting);
    }

    async function saveOption(option) {
        let value;

        if (option === "regional_countries") {

            value = [];
            let nodes = document.querySelectorAll(".regional_country");
            for (let node of nodes) {
                if (node.value && node.value != "") {
                    value.push(node.value);
                } else {
                    node.closest(".country_parent").remove();
                }
            }

        } else if (option === "stores") {

            value = [];
            let nodes = document.querySelectorAll("#store_stores input[type=checkbox]");
            for (let node of nodes) {
                if (node.checked) {
                    value.push(node.id);
                }
            }

        } else if (option.startsWith("context_")) {
            // todo replace promise once browser API support has been merged
            try {
                value = await new Promise((resolve, reject) => {
                    chrome.permissions.request({
                        permissions: ["contextMenus"]
                    }, granted => {
                        let node = document.querySelector(`[data-setting='${option}']`);
                        if (!node) { reject(); }
                        if (!granted) {
                            node.checked = false;
                            reject();
                        }

                        resolve(node.checked);
                    });
                });
            } catch(err) { return; } // Don't save option
        } else {

            let node = document.querySelector("[data-setting='"+option+"']");
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

    function changeFlag(node, selectnode) {
        node.className = "";
        node.classList.add("es_flag_" + selectnode.value, "es_flag");
    }

    function setValue(selector, value) {
        let node = document.querySelector(selector);
        node.value = value;
        let setting = node.closest("[data-setting]");
        if (setting) {
            saveOption(setting.dataset.setting)
        }
    }

    function addCurrencies(currencies) {
        let select = document.getElementById('override_price');
        currencies = currencies
            .map(cu => cu.abbr)
            .filter(cu => cu != 'USD') // already in HTML
            .sort()
            .forEach(currency => {
                let el = document.createElement('option');
                el.value = currency;
                el.innerText = currency;
                select.appendChild(el);
            });
    }

    self.init = async function() {
        let settings = SyncedStorage.init();
        let currency = ExtensionResources.getJSON('json/currency.json').then(addCurrencies);
        await Promise.all([settings, currency]);
        let Defaults = SyncedStorage.defaults;

        loadOptions();
        loadTranslation().then(Sidebar.create);

        document.getElementById("profile_link_images_dropdown").addEventListener("change", loadProfileLinkImages);

        let addHandlerToSetDefaultColor = (key) => {
            document.getElementById(`${key}_default`).addEventListener('click', () => setValue(`#${key}_color`, Defaults[`${key}_color`]));
        };
        [
            'highlight_owned',
            'highlight_wishlist',
            'highlight_coupon',
            'highlight_inv_gift',
            'highlight_inv_guestpass',
            'highlight_notinterested',
            'tag_wishlist',
            'tag_coupon',
            'tag_inv_gift',
            'tag_inv_guestpass',
            'tag_notinterested',
        ].forEach(addHandlerToSetDefaultColor);

        document.getElementById("tag_owned_color_default").addEventListener("click", () => setValue("#tag_owned_color", Defaults.tag_owned_color));
        document.getElementById("spamcommentregex_default").addEventListener("click", () => setValue("#spamcommentregex", "[\\u2500-\\u25FF]"));
        document.getElementById("quickinv_default").addEventListener("click", () => setValue("#quickinv_diff", "-0.01"));

        document.getElementById("quickinv_diff").addEventListener("blur", () => {
            if (isNaN(parseFloat(document.getElementById("quickinv_diff").value))) {
                setValue("#quickinv_diff", "-0.01");
            }
        });

        document.getElementById("clear_countries").addEventListener("click", () => {
            document.querySelectorAll(".regional_country").forEach(node => node.value = "");
            saveOption("regional_countries");
        });

        document.getElementById("reset_countries").addEventListener("click", loadDefaultCountries);

        document.getElementById("region_selects").addEventListener("change", e => {
            let node = e.target.closest(".country_parent");
            if (node) {
                changeFlag(node.querySelector(".es_flag"), e.target);
            }
            saveOption("regional_countries");
        });
        document.getElementById("add_another_region").addEventListener("click", Region.addRegionSelector);

        document.getElementById("regional_price_on").addEventListener("change", e => {
            let node = e.target.closest("#regional_price_on");

            document.getElementById("region_selects").style.display = node.value === "off" ? "none" : "block";
            document.getElementById("regional_price_hideworld").style.display = node.value === "mouse" ? "flex" : "none";
        });

        document.querySelectorAll(".parent_option").forEach(parentOption => {
            parentOption.querySelector("input").addEventListener("change", () => {
                for (let nextSibling = parentOption.nextElementSibling; nextSibling.classList.contains("sub_option"); nextSibling = nextSibling.nextElementSibling) {
                    nextSibling.classList.toggle("disabled");
                }
            });
        });

        document.getElementById("reset").addEventListener("click", clearSettings);

        document.addEventListener("change", saveOptionFromEvent);
        document.addEventListener("blur", saveOptionFromEvent);
        document.addEventListener("select", saveOptionFromEvent);
    };

    return self;
})();

document.addEventListener("DOMContentLoaded", Options.init);

