
let Options = (function(){
    let self = {};
    
    function toggleStores() {
        if (document.querySelector("#stores_all").checked) {
            document.querySelector("#store_stores").style.display="none";
        } else {
            let node = document.querySelector("#store_stores");
            node.style.display="flex";
            
            let stores = SyncedStorage.get("stores");
            
            node.classList.add("es_checks_loaded");
            let nodes = node.querySelectorAll("input[type='checkbox']");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                node.checked = (stores.length == 0 || stores.indexOf(node.id) !== -1);
            }
        }
    }
    
    function loadStores() {
        let cols = 4;
        let node = document.querySelector("#store_stores");
        
        let perCol = Math.ceil(StoreList.length / cols);
        
        let html = "";
        let i = 0;
        for (let c=0; c<cols; c++) {
            html += "<div class='store_col'>";
            for (let len = Math.min(StoreList.length, (c+1)*perCol); i<len; i++) {
                html += `<div><input type="checkbox" id="${StoreList[i].id}"><label for="steam">${StoreList[i].title}</label></div>`;
            }
            html += "</div>";
        }

        HTML.inner(node, html);
    }
    
    function loadTranslation() {
        // When locale files are loaded changed text on page accordingly
        Localization.then(() => {
            document.title = "Augmented Steam " + Localization.str.thewordoptions;
            
            // Localize elements with text
            let nodes = document.querySelectorAll("[data-locale-text]");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                node.textContent = Localization.getString(node.dataset.localeText);
            }
            
            nodes = document.querySelectorAll("[data-locale-html]");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                HTML.inner(node, Localization.getString(node.dataset.localeHtml));
            }
            
            nodes = document.querySelectorAll("#warning_language option");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                let lang = node.textContent;
                let lang_trl = Localization.str.options.lang[node.value.toLowerCase()];
                if (lang !== lang_trl) {
                    node.textContent = lang + " (" + lang_trl + ")";
                }
            }
            
            for (let lang in Localization.str.options.lang) {
                let node = document.querySelector(".language." + lang);
                if (node) {
                    node.textContent = Localization.str.options.lang[lang] + ":";
                }
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
                countryClass = "es_flag_"+country;
            }
            
            return `<div class="country_parent">
            <span class='es_flag ${countryClass}'></span>
            <select class='regional_country'>${options}</select>
            <a class="select2-search-choise-close remove_region"></a>
            </div>`;
        }
        
        self.populateRegionalSelects = function() {
            let addAnotherWrapper = document.querySelector("#add_another_region").parentNode;
            let countries = SyncedStorage.get("regional_countries");
            countries.forEach(country => {
                HTML.beforeBegin(addAnotherWrapper, generateRegionSelect(country));
            });
        };
        
        self.addRegionSelector = function () {
            let addAnotherWrapper = document.querySelector("#add_another_region").parentNode;
            HTML.beforeBegin(addAnotherWrapper, generateRegionSelect());
        };
        
        return self;
    })();
    
    function loadProfileLinkImages() {
        let node = document.querySelector("#profile_link_images_dropdown");
        
        // SyncedStorage.set("show_profile_link_images", node.value); // TODO what were these two lines doing?
        // node.value = SyncedStorage.set("show_profile_link_images", node.value);
        
        let nodes = document.querySelectorAll(".es_sites_icons");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            node.style.display="block";
        }
        
        // FIXME document.querySelector("#profile_links").classList.toggle("es_gray", (SyncedStorage.get("show_profile_link_images") == "gray"));
        
        if (!SyncedStorage.get("show_profile_link_images")) {
            let nodes = document.querySelectorAll(".es_sites_icons");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                node.style.display="none";
            }
        }
    }
    
    function initParentOf(node) {
        let groupSel = node.dataset.parentOf;
        let state = !node.checked;
        
        let groupNode = document.querySelector(groupSel);
        groupNode.classList.toggle("disabled", state);
        
        let nodes = groupNode.querySelectorAll("input,select");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            node.disabled = state;
        }
    }
    
    // Restores select box state to saved value from SyncStorage.
    let changelogLoaded;
    
    function loadOptions() {
        let nodes = document.querySelectorAll("[data-parent-of]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            node.addEventListener("change", function(){
                initParentOf(node);
            })
        }
        
        document.querySelector("#add_custom_link").addEventListener("click", function(e) {
            document.querySelector("#profile_custom").checked = true;
            document.querySelector("#es_custom_settings").style.display="flex";
            document.querySelector("#add_custom_link").style.display="none";
            saveOption("profile_custom");
        });
        
        if (SyncedStorage.get("profile_custom")) {
            document.querySelector("#es_custom_settings").style.display="flex";
            document.querySelector("#add_custom_link").style.display="none";
        }
        
        document.querySelector("#profile_custom").addEventListener("click", function(e) {
            if (!document.querySelector("#profile_custom").checked) {
                document.querySelector("#es_custom_settings").style.display="none";
                document.querySelector("#add_custom_link").style.display="block";
            }
        });
        
        // Set the value or state for each input
        nodes = document.querySelectorAll("[data-setting]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            let setting = node.dataset.setting;
            let value = SyncedStorage.get(setting);
            
            if (value) {
                if (node.type && node.type === "checkbox") {
                    node.checked = value;
                } else {
                    node.value = value;
                }
            }
            
            if (node.dataset.parentOf) {
                initParentOf(node);
            }
        }
        
        if (SyncedStorage.get("showregionalprice")) {
            document.querySelector("#region_selects").style.display = "block";
        }
        if (SyncedStorage.get("showregionalprice") !== "mouse") {
            document.querySelector("#regional_price_hideworld").style.display = "block";
        }
        
        toggleStores();
        Region.populateRegionalSelects();
        
        if (!changelogLoaded) {
            ExtensionResources.getText('changelog.txt')
            .then(data => {
                HTML.inner(
                    document.querySelector("#changelog_text"),
                    data.replace(/\n/g, "\n<br>")
                );
            });
            changelogLoaded = true;
        }
        
        loadTranslation();
        loadProfileLinkImages();
    }
    
    
    function clearSettings() {
        if (!confirm(Localization.str.options.clear)) { return; }
        SyncedStorage.clear();
        SyncedStorage.then(loadOptions);
        // FIXME $("#reset_note").stop(true,true).fadeIn().delay(600).fadeOut();
    }
    
    function loadDefaultCountries() {
        SyncedStorage.remove("regional_countries");
        
        let nodes = document.querySelectorAll("#region_selects div.country_parent");
        for (let i=0, len=nodes.length; i<len; i++) {
            nodes[i].remove();
        }
        
        Region.populateRegionalSelects();
        
        // FIXME $("#saved").stop(true,true).fadeIn().delay(600).fadeOut();
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
    
    function saveOption(option) {
        let value;
        
        if (option === "regional_countries") {
            
            value = [];
            let nodes = document.querySelectorAll(".regional_country");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                if (node.value && node.value != "") {
                    value.push(node.value);
                } else {
                    node.closest(".country_parent").remove();
                }
            }
            
        } else if (option === "stores") {
            
            value = [];
            let nodes = document.querySelectorAll("#store_stores input[type=checkbox]");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                if (node.checked) {
                    value.push(node.id);
                }
            }
            
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
        
        // FIXME $("#saved").stop(true, true).fadeIn().delay(600).fadeOut();
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
            })
            ;
    }

    self.init = async function() {
        let settings = SyncedStorage.init();
        let currency = ExtensionResources.getJSON('json/currency.json').then(addCurrencies);
        await Promise.all([settings, currency]);
        let Defaults = SyncedStorage.defaults;

        loadStores();
        loadOptions();
        loadProfileLinkImages();
        
        // document.querySelector("#language").addEventListener("change", loadTranslation);
        document.querySelector("#profile_link_images_dropdown").addEventListener("change", loadProfileLinkImages);
        
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

        document.querySelector("#tag_owned_color_default").addEventListener("click", function(){
            setValue("#tag_owned_color", Defaults.tag_owned_color);
        });

        document.querySelector("#spamcommentregex_default").addEventListener("click", function(){
            setValue("#spamcommentregex", "[\\u2500-\\u25FF]");
        });
        document.querySelector("#quickinv_default").addEventListener("click", function() {
            setValue("#quickinv_diff", "-0.01");
        });
        document.querySelector("#quickinv_diff").addEventListener("blur", function() {
            if (isNaN(parseFloat(document.querySelector("#quickinv_diff").value))) {
                setValue("#quickinv_diff", "-0.01");
            }
        });
        
        document.querySelector("#show_spamcommentregex").addEventListener("click", function(e){
            let listNode = document.querySelector("#spamcommentregex_list");
            listNode.classList.toggle("esi-hidden");
        });
        document.querySelector("#show_quickinv_diff").addEventListener("click", function(e) {
            let node = document.querySelector("#quickinv_opt");
            node.classList.toggle("esi-hidden");
        });
        document.querySelector("#stores_all").addEventListener("change", toggleStores);
        document.querySelector("#reset_countries").addEventListener("click", loadDefaultCountries);
        
        document.querySelector('#region_selects').addEventListener('change', function(e) {
            let node = e.target.closest(".country_parent");
            if (node) {
                changeFlag(node.querySelector('.es_flag'), e.target);
            }
            saveOption("regional_countries");
        });
        document.querySelector('#add_another_region').addEventListener("click", Region.addRegionSelector);
        
        document.querySelector("#regional_price_on").addEventListener("change", function(e) {
            let node = e.target.closest("#regional_price_on");
            
            document.querySelector("#region_selects").style.display = node.value === "off" ? "none" : "block";
            document.querySelector("#regional_price_hideworld").style.display = node.value === "mouse" ? "flex" : "none";
        });
        
        // Toggle tabs content
        document.querySelector("#side_bar").addEventListener("click", function(e){
            let node = e.target.closest("a.tab_row");
            if (!node) { return; }
            let sel = node.dataset.blockSel;
            document.querySelector("a.tab_row.selected").classList.remove("selected");
            document.querySelector(".content.selected").classList.remove("selected");
            document.querySelector(sel).classList.add("selected");
            node.classList.add("selected");
        });
        
        document.querySelector("#reset").addEventListener("click", clearSettings);
        
        document.addEventListener("change", saveOptionFromEvent);
        document.addEventListener("blur", saveOptionFromEvent);
        document.addEventListener("select", saveOptionFromEvent);
    };
    
    return self;
})();

document.addEventListener("DOMContentLoaded", Options.init);

