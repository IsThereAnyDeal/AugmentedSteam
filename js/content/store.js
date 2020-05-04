
class Customizer {

    constructor(settingsName) {
        this.settingsName = settingsName;
        this.settings = SyncedStorage.get(settingsName);
    }

    _textValue(node) {
        let textNode = node.querySelector("h1, h2, .home_title, .home_section_title");
        if (!textNode) return "";
        let str = "";
        for (let node of textNode.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                str += node.textContent.trim();
            }
        }
        return str;
    }

    _updateValue(name, value) {
        this.settings[name] = value;
        SyncedStorage.set(this.settingsName, this.settings);
    }

    _getValue(name) {
        let value = this.settings[name];
        return (typeof value === "undefined") || value;
    }

    add(name, targets, text, forceShow) {

        let elements;

        if (typeof targets === "string") {
            elements = Array.from(document.querySelectorAll(targets));
        } else if (targets instanceof NodeList) {
            elements = Array.from(targets);
        } else {
            elements = targets ? [targets] : [];
        }

        if (!elements.length) return this;

        let state = this._getValue(name);

        let isValid = false;

        elements.forEach((element, i) => {
            if (getComputedStyle(element).display === "none" && !forceShow) {
                elements.splice(i, 1);
                return;
            }

            if (typeof text !== "string" || text === "") {
                text = this._textValue(element).toLowerCase();
                if (text === "") return;
            }

            isValid = true;
        });

        if (!isValid) return this;

        for (let element of elements) {
            element.classList.toggle("esi-shown", state);
            element.classList.toggle("esi-hidden", !state);
            element.classList.add("esi-customizer");
            element.dataset.es_name = name;
            element.dataset.es_text = text;
        }

        return this;
    }

    addDynamic(node) {
        let text = this._textValue(node).toLowerCase();
        if (text === "") return;

        this.add(`dynamic_${text}`, node, text);
    }

    build() {

        let customizerEntries = new Map();

        for (let element of document.querySelectorAll(".esi-customizer")) {

            let name = element.dataset.es_name;

            if (customizerEntries.has(name)) {
                customizerEntries.get(name).push(element);
            } else {

                let state = element.classList.contains("esi-shown");
                let text = element.dataset.es_text;

                HTML.beforeEnd("#es_customize_btn .home_viewsettings_popup",
                    `<div class="home_viewsettings_checkboxrow ellipsis" id="${name}">
                        <div class="home_viewsettings_checkbox ${state ? 'checked' : ''}"></div>
                        <div class="home_viewsettings_label">${text}</div>
                    </div>`);

                customizerEntries.set(name, [element]);
            }
        }

        for (let [name, elements] of customizerEntries) {
            let checkboxrow = document.getElementById(name);
            checkboxrow.addEventListener("click", e => {
                let state = !checkboxrow.querySelector(".checked");

                for (let element of elements) {
                    element.classList.toggle("esi-shown", state);
                    element.classList.toggle("esi-hidden", !state);
                }

                e.target.closest(".home_viewsettings_checkboxrow")
                    .querySelector(".home_viewsettings_checkbox").classList.toggle("checked", state);

                this._updateValue(name, state);
            });
        }
    }
}

class StorePageClass {

    isSubPage() {
        return /^\/sub\/\d+/.test(window.location.pathname);
    }

    hasAchievements() {
        
    }

    async showRegionalPricing(type) {

        
    }
}


class SubPageClass extends StorePageClass {
    constructor(url) {
        super();

        this.subid = GameId.getSubid(url);

        this.addDrmWarnings();
        this.addPrices();
        this.addLinks("sub");
        this.showRegionalPricing("sub");
        this.subscriptionSavingsCheck();
    }

    subscriptionSavingsCheck() {
        setTimeout(() => {
            let notOwnedTotalPrice = 0;

            for (let node of document.querySelectorAll(".tab_item:not(.ds_owned)")) {
                let priceNode = node.querySelector(".discount_final_price");
                // Only present when the product has a price associated with (so it's not free or N/A)
                if (priceNode) {
                    let priceContainer = priceNode.textContent.trim();
                    if (priceContainer) {
                        let price = Price.parseFromString(priceContainer);
                        if (price) {
                            notOwnedTotalPrice += price.value;
                            continue;
                        }
                    }
                } else {
                    let finalPrice = node.querySelector(".final_price");
                    if (finalPrice) {
                        if (finalPrice.textContent === "N/A") {
                            notOwnedTotalPrice = null;
                            break;
                        }
                    }
                    continue;
                }
                console.warn("Couldn't find any price information for appid", node.dataset.dsAppid);
            }

            if (notOwnedTotalPrice !== null) {
                let priceNode = DOMHelper.selectLastNode(document, ".package_totals_area .price");
                let packagePrice = Price.parseFromString(priceNode.textContent);
                if (!packagePrice) { return; }

                notOwnedTotalPrice -= packagePrice.value;
                notOwnedTotalPrice = new Price(notOwnedTotalPrice);

                if (!document.querySelector("#package_savings_bar")) {
                    HTML.beforeEnd(".package_totals_area",
                        `<div id="package_savings_bar">
                            <div class="savings"></div>
                            <div class="message">${Localization.str.bundle_saving_text}</div>
                        </div>`);
                }

                let savingsNode = document.querySelector("#package_savings_bar > .savings");
                savingsNode.textContent = notOwnedTotalPrice;
                if (notOwnedTotalPrice.value < 0) {
                    savingsNode.style.color = "red";
                }
            }

        }, 500); // why is this here?
    }
}


class BundlePageClass extends StorePageClass {
    constructor(url) {
        super();

        this.bundleid = GameId.getBundleid(url);

        this.addDrmWarnings();
        this.addPrices();
        this.addLinks("bundle");
    }
}

class AppPageClass extends StorePageClass {
    constructor(url) {
        super();

        this.userNotes = new UserNotes();

        this.appid = GameId.getAppid(url);
        this.storeid = `app/${this.appid}`;

        this.onWishAndWaitlistRemove = null;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        let communityAppidSrc = document.querySelector(".apphub_AppIcon img").getAttribute("src");
        this.communityAppid = GameId.getAppidImgSrc(communityAppidSrc);
        if (!this.communityAppid) {
            this.communityAppid = this.appid;
        }

        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise().catch(err => console.error(err));
        this.appName = document.querySelector(".apphub_AppName").textContent;

        new MediaPage().appPage();

        this.addSupport();

        Highlights.addTitleHighlight(this.appid);
    }    

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid, this.metalink, SyncedStorage.get("showoc"));
    }

    async _removeFromWishlist() {
        return Background.action("wishlist.remove", this.appid, User.getSessionId());
    }

    async _removeFromWaitlist() {
        return Background.action("itad.removefromwaitlist", this.appid);
    }

    getFirstSubid() {
        let node = document.querySelector("div.game_area_purchase_game input[name=subid]");
        return node && node.value;
    }

    async addSupport() {
        if (this.isDlc() || !SyncedStorage.get("showsupportinfo")) { return; }

        let cache = LocalStorage.get("support_info", null);
        if (!cache || !cache.expiry || cache.expiry < Date.now()) {
            cache = {
                "data": {},
                "expiry": Date.now() + (31 * 86400 * 1000) // 31 days
            }
        }

        let appid = this.appid;
        let supportInfo = cache[appid];
        if (!supportInfo) {
            let response = await Background.action("appdetails", appid, "support_info");
            if (!response || !response.success) {
                console.warn("Failed to retrieve support info");
                return;
            }

            supportInfo = response.data.support_info;

            cache["data"][appid] = supportInfo;
            LocalStorage.set("support_info", cache);
        }

        let url = supportInfo.url;
        let email = supportInfo.email;
        if (!email && !url) { return; }

        let support = "";
        if (url) {
            support += `<a href="${url}">${Localization.str.website}</a>`;
        }

        if (email) {
            if (url) {
                support += ", ";
            }

            // From https://emailregex.com/
            let emailRegex =
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (emailRegex.test(email)) {
                support += `<a href="mailto:${email}">${Localization.str.email}</a>`;
            } else {
                support += `<a href="${email}">${Localization.str.contact}</a>`;
            }
        }

        HTML.beforeEnd(".glance_ctn .user_reviews",
            `<div class="release_date">
                <div class="subtitle column">${Localization.str.support}:</div>
                <div class="summary column" id="es_support_list">${support}</div>
            </div>`);
    }
}


let RegisterKeyPageClass = (function(){

    function RegisterKeyPageClass() {
        this.activateMultipleKeys();
    }

    RegisterKeyPageClass.prototype.activateMultipleKeys = function() {
        let activateModalTemplate = `<div id="es_activate_modal">
                <div id="es_activate_modal_content">
                    <div class="newmodal_prompt_with_textarea gray_bevel fullwidth" id="es_activate_input_text">
                        <textarea name="es_key_input" id="es_key_input" rows="24" cols="12" maxlength="1080">__alreadyentered__</textarea>
                    </div>
                    <div class="es_activate_buttons" style="float: right">
                        <div class="btn_green_white_innerfade btn_medium es_activate_modal_submit">
                            <span>${Localization.str.activate_products}</span>
                        </div>
                        <div class="es_activate_modal_close btn_grey_white_innerfade btn_medium">
                            <span>${Localization.str.cancel}</span>
                        </div>
                    </div>
                </div>
            </div>`;

        function showMultipleKeysDialog() {
            ExtensionLayer.runInPageContext((header, template) => {
                ShowDialog(header, template);
            },
            [
                Localization.str.activate_multiple_header,
                activateModalTemplate.replace("__alreadyentered__", document.querySelector("#product_key").value.replace(/\,/g, "\n"))
            ]);
        }

        document.querySelector("#register_btn").addEventListener("click", function(e) {
            if (document.querySelector("#product_key").value.indexOf(",") > 0) {
                e.preventDefault();
                showMultipleKeysDialog();
            }
        });

        // Show note input modal
        document.addEventListener("click", function(e){
            if (!e.target.closest("#es_activate_multiple")) { return; }
            showMultipleKeysDialog();
        });

        // Insert the "activate multiple products" button
        HTML.beforeBegin("#registerkey_examples_text",
            "<a class='btnv6_blue_hoverfade btn_medium' id='es_activate_multiple' style='margin-bottom: 15px;'><span>" + Localization.str.activate_multiple + "</span></a><div style='clear: both;'></div>");

        // Process activation

        document.addEventListener("click", function(e) {
            if (!e.target.closest(".es_activate_modal_submit")) { return; }

            document.querySelector(".es_activate_modal_submit").style.display = "none";
            document.querySelector(".es_activate_modal_close").style.display = "none";

            let keys = [];

            // turn textbox into table to display results
            let lines = document.querySelector("#es_key_input").value.split("\n");
            let node = document.querySelector("#es_activate_input_text");
            HTML.beforeBegin(node, "<div id='es_activate_results'></div>");
            node.style.display = "none";

            lines.forEach(line => {
                let attempt = String(line);
                if (attempt === "") { // skip blank rows in the input dialog (including trailing newline)
                    return;
                }
                keys.push(attempt);

                let url = ExtensionResources.getURL("img/questionmark.png");

                HTML.beforeEnd("#es_activate_results",
                    "<div style='margin-bottom: 8px;'><span id='attempt_" + attempt + "_icon'><img src='" + url + "' style='padding-right: 10px; height: 16px;'></span>" + attempt + "</div><div id='attempt_" + attempt + "_result' style='margin-left: 26px; margin-bottom: 10px; margin-top: -5px;'></div>");
            });

            // force recalculation of the modal's position so it doesn't extend off the bottom of the page
            setTimeout(function(){
                window.dispatchEvent(new Event("resize"));
            }, 250);

            // attempt to activate each key in sequence
            let promises = [];

            for (let i = 0; i < keys.length; i++) {
                let current_key = keys[i];

                let formData = new FormData();
                formData.append("sessionid", User.getSessionId());
                formData.append("product_key", current_key);

                let request = RequestData.post("https://store.steampowered.com/account/ajaxregisterkey", formData).then(data => {
                    data = JSON.parse(data);
                    let attempted = current_key;
                    let message = Localization.str.register.default;
                    if (data["success"] === 1) {
                        document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionResources.getURL("img/sr/okay.png"));
                        if (data["purchase_receipt_info"]["line_items"].length > 0) {
                            document.querySelector("#attempt_" + attempted + "_result").textContent = Localization.str.register.success.replace("__gamename__", data["purchase_receipt_info"]["line_items"][0]["line_item_description"]);
                            document.querySelector("#attempt_" + attempted + "_result").style.display = "block";
                        }
                    } else {
                        switch(data["purchase_result_details"]) {
                            case 9: message = Localization.str.register.owned; break;
                            case 13: message = Localization.str.register.notavail; break;
                            case 14: message = Localization.str.register.invalid; break;
                            case 15: message = Localization.str.register.already; break;
                            case 24: message = Localization.str.register.dlc; break;
                            case 50: message = Localization.str.register.wallet; break;
                            case 53: message = Localization.str.register.toomany; break;
                        }
                        document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionResources.getURL("img/sr/banned.png"));
                        document.querySelector("#attempt_" + attempted + "_result").textContent = message;
                        document.querySelector("#attempt_" + attempted + "_result").style.display="block";
                    }

                }, () => {
                    let attempted = current_key;
                    document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionResources.getURL("img/sr/banned.png"));
                    document.querySelector("#attempt_" + attempted + "_result").textContent = Localization.str.error;
                    document.querySelector("#attempt_" + attempted + "_result").style.display = "block";
                });

                promises.push(request);
            }

            Promise.all(promises).then(result => {
                document.querySelector(".es_activate_modal_close span").textContent = Localization.str.close;
                document.querySelector(".es_activate_modal_close").style.display = "block";
                window.dispatchEvent(new Event("resize"));
            });
        });

        // Bind the "Cancel" button to close the modal
        document.addEventListener("click", function(e) {
            if (!e.target.closest(".es_activate_modal_close")) { return; }
            ExtensionLayer.runInPageContext(() => { CModal.DismissActiveModal(); });
        })
    };

    return RegisterKeyPageClass;
})();


let AccountPageClass = (function(){

    function AccountPageClass() {
        this.accountTotalSpent();
    }

    AccountPageClass.prototype.accountTotalSpent = function() {

        let links = document.querySelectorAll(".account_setting_block:nth-child(2) .account_setting_sub_block:nth-child(2) .account_manage_link");
        if (links.length < 1) return;

        let lastLink = links[links.length-1];
        HTML.afterEnd(lastLink.parentNode,
            `<div><a class='account_manage_link' href='https://help.steampowered.com/accountdata/AccountSpend'>${Localization.str.external_funds}</a></div>`);
    };

    return AccountPageClass;
})();


let FundsPageClass = (function(){

    function FundsPageClass() {
        this.addCustomMoneyAmount();
    }

    FundsPageClass.prototype.addCustomMoneyAmount = function() {
        let giftcard = window.location.pathname.startsWith("/digitalgiftcards/");

        let minAmountNode = document.querySelector(giftcard ? ".giftcard_selection" : ".addfunds_area_purchase_game");
        let newel = minAmountNode.cloneNode(true);
        newel.classList.add("es_custom_money");

        let priceel = newel.querySelector(giftcard ? ".giftcard_text" : ".price");
        let price = priceel.textContent.trim();

        let currency = CurrencyRegistry.fromType(Currency.storeCurrency);
        let minValue = currency.valueOf(price);
        let step = Math.pow(10, -currency.format.decimalPlaces);

        let input = `<input type="number" id="es_custom_money_amount" class="es_text_input money" min="${minValue}" step="${step}" value="${minValue}">`;

        // add currency symbol
        if (currency.format.postfix) {
            input += currency.format.symbol;
        } else {
            input = currency.format.symbol + input;
        }

        if (giftcard) {
            let styleel = newel.querySelector(".giftcard_style");
            HTML.inner(styleel, Localization.str.wallet.custom_giftcard.replace("__input__", `<span>${input}</span>`));
            newel.querySelector("#es_custom_money_amount").dataset.tooltipText = Localization.str.wallet.custom_amount_text.replace("__minamount__", price);

            minAmountNode.insertAdjacentElement("afterend", newel);

            styleel.addEventListener("click", e => {
                e.preventDefault();
            });
        } else {
            HTML.inner(priceel, input);
            newel.querySelector("h1").textContent = `${Localization.str.wallet.custom_amount} ${price}`;
            newel.querySelector("p").textContent = Localization.str.wallet.custom_amount_text.replace("__minamount__", price);

            minAmountNode.insertAdjacentElement("afterend", newel);
        }

        newel.querySelector("#es_custom_money_amount").addEventListener("input", e => {
            let value = e.target.value;
            if (value < minValue) {
                value = minValue; // prevent purchase error
            }

            let customAmount = Number(value).toFixed(2).replace(/[,.]/g, '');

            if (giftcard) {
                priceel.textContent = new Price(value);
                priceel.classList.toggle("small", priceel.textContent.length > 8);
                newel.querySelector("a.btn_medium").href = `javascript:submitSelectGiftCard( ${customAmount} );`;
            } else {
                newel.querySelector("h1").textContent = `${Localization.str.wallet.custom_amount} ${new Price(value)}`;
                newel.querySelector("a.btn_medium").dataset.amount = customAmount;
            }
        });
    };

    return FundsPageClass;
})();


let SearchPageClass = (function(){

    function SearchPageClass() {
        infiniteScrollEnabled = document.querySelector(".search_pagination").style.display === "none";

        this.addSearchFilters();
        this.observeChanges();
    }

    let infiniteScrollEnabled;

    let eaFilter;

    let scoreFilter;
    let minScoreInput, maxScoreInput;
    let rangeDisplay;

    let minCountInput, maxCountInput;

    let maxStep;
    let scoreValues = [];
    let stepSize = 5;

    for (let score = 0; score < 100; score += stepSize) {
        scoreValues.push(score);
    }
    maxStep = scoreValues.length;

    function addRowMetadata(rows = document.querySelectorAll(".search_result_row:not([data-as-review-count])")) {
        for (let row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.mixed"))     { row.classList.add("as-hide-mixed");      }
            if (row.querySelector(".search_reviewscore span.search_review_summary.negative"))  { row.classList.add("as-hide-negative");   }

            let reviewPercentage = 100;
            let reviewCount = 0;
            let reviewsNode = row.querySelector(".search_review_summary");
            if (reviewsNode) {
                let match = reviewsNode.dataset.tooltipHtml.match(/(\d{1,3})%.*?((?:\d{1,3},?)+)/);
                if (match) {
                    reviewPercentage = Number(match[1]);
                    reviewCount = Number(match[2].replace(/,/g, ''));
                }
            }

            row.dataset.asReviewPercentage = reviewPercentage;
            row.dataset.asReviewCount = reviewCount;
        }

        if (eaFilter.classList.contains("checked")) {
            addEaMetadata(rows);
        }

        applyFilters(rows);
    }

    async function addEaMetadata(rows = document.querySelectorAll(".search_result_row:not(.es_ea_checked)")) {
        if (SyncedStorage.get("show_early_access")) { return; }

        for (let row of await EarlyAccess.getEaNodes(rows)) {
            row.classList.add("es_early_access");
        }
    }

    function paramsToObject(params) {
        let paramsObj = {};
        for (let [key, val] of params) {
            paramsObj[key] = val;
        }
        return paramsObj;
    }

    function modifyParams(searchParams, entries) {
        for (let [key, val] of entries) {
            if (val !== "" && val !== null) {
                searchParams.set(key, val);
            } else {
                searchParams.delete(key);
            }
        }
    }

    async function modifyPageLinks() {
        if (!infiniteScrollEnabled) {
            for (let linkElement of document.querySelectorAll(".search_pagination_right a")) {
                let curParams = new URLSearchParams(window.location.search);
                let url = new URL(linkElement.href);
                let params = url.searchParams;

                modifyParams(params, [
                    ["as-hide", curParams.get("as-hide")],
                    ["as-reviews-score", curParams.get("as-reviews-score")],
                    ["as-reviews-count", curParams.get("as-reviews-count")],
                ]);

                /* We can't simply use URLSearchParams.prototype.toString here, since existing query string parameters
                 * would be modified when stringifying back again (e.g. "white%20space" will turn into "white+space" and break links).
                 * Therefore the URLSearchParameters are converted to an object and parsed by Prototype's Object.toQueryString. */
                ExtensionLayer.runInPageContext(obj => Object.toQueryString(obj), [paramsToObject(params)], true)
                    .then(queryString => {
                        url.search = `?${queryString}`;
                        linkElement.href = url.href;
                    });
            }
        }
    }

    function applyCountFilter(rows = document.querySelectorAll(".search_result_row")) {

        let minCount, maxCount;

        for (let input of [minCountInput, maxCountInput]) {
            let val;
            if (input.value === '' && input === maxCountInput) {
                val = Infinity;
            } else {
                val = Number(input.value);
            }

            if (input === minCountInput) {
                minCount = val;
            } else {
                maxCount = val;
            }
        }

        for (let row of rows) {
            let rowCount = Number(row.dataset.asReviewCount);
            row.classList.toggle("as-reviews-count", rowCount < minCount || rowCount > maxCount);
        }
    }

    function applyScoreFilter(rows = document.querySelectorAll(".search_result_row")) {
        let minScore = scoreValues[Number(document.querySelector(".js-reviews-score-lower").value)];

        let maxVal = Number(document.querySelector(".js-reviews-score-upper").value);
        let maxScore = maxVal === maxStep ? Infinity : scoreValues[maxVal];

        for (let row of rows) {
            let rowScore = Number(row.dataset.asReviewPercentage);
            row.classList.toggle("as-reviews-score", rowScore < minScore || rowScore > maxScore);
        }
    }

    function applyFilters(rows) {
        applyScoreFilter(rows);
        applyCountFilter(rows);
    }

    SearchPageClass.prototype.addSearchFilters = function() {

        let collapseName = "augmented_steam";
        let filterNames = [
            "cart",
            "ea",
            "mixed",
            "negative",
        ];

        let activeFilters = getASFilters();

        let results = document.getElementById("search_results");

        function getASFilters() {
            let paramsObj = {};
            let params = new URLSearchParams(window.location.search);

            let rawParam = params.get("as-hide");
            if (rawParam) {
                paramsObj["as-hide"] = new Set(rawParam.split(','));
            } else {
                paramsObj["as-hide"] = new Set();
            }

            paramsObj["as-reviews-score"] = params.get("as-reviews-score");
            paramsObj["as-reviews-count"] = params.get("as-reviews-count");

            return paramsObj;
        }

        function setFilterStates() {
            for (let filterName of filterNames) {
                /**
                 * https://github.com/SteamDatabase/SteamTracking/blob/0705b45875511f8dd802002622ad3d7abcabfc6e/store.steampowered.com/public/javascript/searchpage.js#L815
                 * EnableClientSideFilters
                 */
                let filter = document.querySelector(`span[data-param="augmented_steam"][data-value="${filterName}"]`);

                let active = activeFilters["as-hide"].has(filterName);
                results.classList.toggle(filterName, active);
                filter.classList.toggle("checked", active);
                filter.parentElement.classList.toggle("checked", active);

                if (filterName === "ea" && active) {
                    addEaMetadata();
                }
            }

            let lowerScoreVal = "0";
            let upperScoreVal = maxStep.toString();

            if (activeFilters["as-reviews-score"]) {
                let match = activeFilters["as-reviews-score"].match(/(^\d*)-(\d*)/);
                if (match) {
                    let [, lower, upper] = match;
                    lower = parseInt(lower);
                    upper = parseInt(upper);

                    if (!isNaN(lower) && scoreValues.includes(lower)) {
                        lowerScoreVal = scoreValues.indexOf(lower).toString();
                    }
                    if (!isNaN(upper) && scoreValues.includes(upper)) {
                        upperScoreVal = scoreValues.indexOf(upper).toString();
                    }
                }
            }

            if (lowerScoreVal !== minScoreInput.value) {
                minScoreInput.value = lowerScoreVal;
                minScoreInput.dispatchEvent(new Event("input"));
            }
            if (upperScoreVal !== maxScoreInput.value) {
                maxScoreInput.value = upperScoreVal;
                maxScoreInput.dispatchEvent(new Event("input"));
            }

            let lowerCountVal = '';
            let upperCountVal = '';

            if (activeFilters["as-reviews-count"]) {
                let match = activeFilters["as-reviews-count"].match(/(^\d*)-(\d*)/);
                if (match) {
                    let [, lower, upper] = match;
                    lower = parseInt(lower);
                    upper = parseInt(upper);

                    if (!isNaN(lower)) {
                        lowerCountVal = lower;
                    }
                    if (!isNaN(upper)) {
                        upperCountVal = upper;
                    }
                }
            }

            if (lowerCountVal !== minCountInput.value) {
                minCountInput.value = lowerCountVal;
            }
            if (upperCountVal !== maxCountInput.value) {
                maxCountInput.value = upperCountVal;
            }
        }

        function updateUrls(key, val) {

            /**
             * This hidden input is required for GatherSearchParameters,
             * otherwise AS' inputs are not considered when selecting another Steam native filter.
             * https://github.com/SteamDatabase/SteamTracking/blob/1dfdbd838714d4b868e0221ca812696ca05f0a6b/store.steampowered.com/public/javascript/searchpage.js#L177
             */
            document.getElementsByName(key)[0].value = val;

            // Update the current URL
            let curParams = new URLSearchParams(window.location.search);
            modifyParams(curParams, [[key, val]]);

            ExtensionLayer.runInPageContext(params => {
                // https://github.com/SteamDatabase/SteamTracking/blob/a4cdd621a781f2c95d75edecb35c72f6781c01cf/store.steampowered.com/public/javascript/searchpage.js#L217
                UpdateUrl(params);
            }, [ paramsToObject(curParams) ]);

            modifyPageLinks();

            activeFilters = getASFilters();
        }

        HTML.afterBegin("#advsearchform .rightcol",
            `<div class="block search_collapse_block" data-collapse-name="${collapseName}">
                <div class="block_header"><div>${Localization.str.filters}</div></div>
                <div class="block_content block_content_inner">
                    <div class="tab_filter_control_row" data-param="augmented_steam" data-value="cart" data-loc="${Localization.str.search_filters.hide_cart}" data-clientside="1">
                        <span class="tab_filter_control tab_filter_control_include" data-param="augmented_steam" data-value="cart" data-loc="${Localization.str.search_filters.hide_cart}" data-clientside="1">
                            <span>
                                <span class="tab_filter_control_checkbox"></span>
                                <span class="tab_filter_control_label">${Localization.str.search_filters.hide_cart}</span>
                                <span class="tab_filter_control_count" style="display: none;"></span>
                            </span>
                        </span>
                    </div>
                    <div class="js-ea-filter tab_filter_control_row" data-param="augmented_steam" data-value="ea" data-loc="${Localization.str.search_filters.hide_ea}" data-clientside="1">
                        <span class="tab_filter_control tab_filter_control_include" data-param="augmented_steam" data-value="ea" data-loc="${Localization.str.search_filters.hide_ea}" data-clientside="1">
                            <span>
                                <span class="tab_filter_control_checkbox"></span>
                                <span class="tab_filter_control_label">${Localization.str.search_filters.hide_ea}</span>
                                <span class="tab_filter_control_count" style="display: none;"></span>
                            </span>
                        </span>
                    </div>
                    <div class="tab_filter_control_row" data-param="augmented_steam" data-value="mixed" data-loc="${Localization.str.search_filters.hide_mixed}" data-clientside="1">
                        <span class="tab_filter_control tab_filter_control_include" data-param="augmented_steam" data-value="mixed" data-loc="${Localization.str.search_filters.hide_mixed}" data-clientside="1">
                            <span>
                                <span class="tab_filter_control_checkbox"></span>
                                <span class="tab_filter_control_label">${Localization.str.search_filters.hide_mixed}</span>
                                <span class="tab_filter_control_count" style="display: none;"></span>
                            </span>
                        </span>
                    </div>
                    <div class="tab_filter_control_row" data-param="augmented_steam" data-value="negative" data-loc="${Localization.str.search_filters.hide_negative}" data-clientside="1">
                        <span class="tab_filter_control tab_filter_control_include" data-param="augmented_steam" data-value="negative" data-loc="${Localization.str.search_filters.hide_negative}" data-clientside="1">
                            <span>
                                <span class="tab_filter_control_checkbox"></span>
                                <span class="tab_filter_control_label">${Localization.str.search_filters.hide_negative}</span>
                                <span class="tab_filter_control_count" style="display: none;"></span>
                            </span>
                        </span>
                    </div>
                    <div><input type="hidden" name="as-hide"></div>
                    <div class="block_rule"></div>
                    <div class="range_container" style="margin-top: 8px;">
                        <div class="as-double-slider js-reviews-score-filter range_container_inner">
                            <input class="as-double-slider__input as-double-slider__input--upper js-reviews-score-input js-reviews-score-upper range_input" type="range" min="0" max="${maxStep}" step="1" value="${maxStep}">
                            <input class="as-double-slider__input as-double-slider__input--lower js-reviews-score-input js-reviews-score-lower range_input" type="range" min="0" max="${maxStep}" step="1" value="0">
                            <input type="hidden" name="as-reviews-score">
                        </div>
                        <div class="as-range-display range_display">${Localization.str.search_filters.reviews_score.any}</div>
                    </div>
                    <div class="as-reviews-count-filter">
                        <div class="as-reviews-count-filter__header">${Localization.str.search_filters.reviews_count.count}</div>
                        <div class="as-reviews-count-filter__content js-reviews-count-filter">
                            <input class="as-reviews-count-filter__input js-reviews-count-input js-reviews-count-lower" type="number" min="0" step="100" placeholder="${Localization.str.search_filters.reviews_count.min_count}">
                            -
                            <input class="as-reviews-count-filter__input js-reviews-count-input js-reviews-count-upper" type="number" min="0" step="100" placeholder="${Localization.str.search_filters.reviews_count.max_count}">
                            <input type="hidden" name="as-reviews-count">
                        </div>
                    </div>
                </div>
            </div>
        `);

        eaFilter = document.querySelector(".js-ea-filter");
        scoreFilter = document.querySelector(".js-reviews-score-filter");
        minScoreInput = scoreFilter.querySelector(".js-reviews-score-lower");
        maxScoreInput = scoreFilter.querySelector(".js-reviews-score-upper");
        rangeDisplay = scoreFilter.nextElementSibling;

        // Setup handlers for reviews score filter
        for (let input of document.querySelectorAll(".js-reviews-score-input")) {

            let minVal = parseInt(minScoreInput.value);
            let maxVal = parseInt(maxScoreInput.value);

            input.addEventListener("input", () => {

                minVal = parseInt(minScoreInput.value);
                maxVal = parseInt(maxScoreInput.value);

                if (input === maxScoreInput) {
                    if (minVal >= maxVal) {
                        if (minVal <= 0) {
                            maxScoreInput.value = maxVal = 1;
                        } else {
                            minScoreInput.value = minVal = maxVal - 1;
                        }
                    }
                } else {
                    if (maxVal <= minVal) {
                        // Happens when the user clicks to the highest step after the max thumb instead of dragging
                        if (minVal === maxStep) {
                            minScoreInput.value = minVal = maxStep - 1;
                            maxScoreInput.value = maxVal = maxStep;
                        } else if (maxVal < maxStep) {
                            maxScoreInput.value = maxVal = minVal + 1;
                        } else {
                            minScoreInput.value = minVal = maxVal - 1;
                        }
                    }
                }

                let text;
                if (minVal === 0) {
                    if (maxVal === maxStep) {
                        text = Localization.str.search_filters.reviews_score.any;
                    } else {
                        text = Localization.str.search_filters.reviews_score.up_to.replace("__score__", scoreValues[maxVal]);
                    }
                } else {
                    if (maxVal === maxStep) {
                        text = Localization.str.search_filters.reviews_score.from.replace("__score__", scoreValues[minVal]);
                    } else {
                        text = Localization.str.search_filters.reviews_score.between.replace("__lower__", scoreValues[minVal]).replace("__upper__", scoreValues[maxVal]);
                    }
                }

                rangeDisplay.textContent = text;
            });

            input.addEventListener("change", () => {
                applyScoreFilter();

                let val = "";
                if (minVal !== 0 || maxVal !== maxStep) {
                    val = `${minVal === 0 ? '' : scoreValues[minVal]}-${maxVal === maxStep ? '' : scoreValues[maxVal]}`;
                }

                updateUrls("as-reviews-score", val);
            });
        }

        minCountInput = document.querySelector(".js-reviews-count-lower");
        maxCountInput = document.querySelector(".js-reviews-count-upper");

        for (let input of document.querySelectorAll(".js-reviews-count-input")) {

            input.addEventListener("change", () => {
                applyCountFilter();

                let minVal = minCountInput.value;
                let maxVal = maxCountInput.value;
                let val = "";

                if ((minVal && Number(minVal) !== 0) || maxVal) {
                    val = `${minVal}-${maxVal}`;
                }
                updateUrls("as-reviews-count", val);
            });

            input.addEventListener("keydown", e => {
                if(e.key === "Enter") {
                    // Prevents unnecessary submitting of the advanced search form
                    e.preventDefault();

                    input.dispatchEvent(new Event("change"));
                }
            });
        }

        // Setup handlers for other toggleable filters
        for (let filterName of filterNames) {

            let filter = document.querySelector(`span[data-param="augmented_steam"][data-value="${filterName}"]`);

            filter.addEventListener("click", () => {
                /**
                 * https://github.com/SteamDatabase/SteamTracking/blob/0705b45875511f8dd802002622ad3d7abcabfc6e/store.steampowered.com/public/javascript/searchpage.js#L859
                 * OnClickClientFilter
                 */
                let savedOffset = filter.getBoundingClientRect().top;
                let isChecked = filter.classList.toggle("checked");

                if (isChecked) {
                    results.classList.add(filterName);
                    filter.parentElement.classList.add("checked");
                } else {
                    results.classList.remove(filterName);
                    filter.parentElement.classList.remove("checked");
                }

                let fixScrollOffset = document.scrollTop - savedOffset + filter.getBoundingClientRect().top;
                document.scrollTop = fixScrollOffset;

                if (isChecked) {
                    activeFilters["as-hide"].add(filterName);
                } else {
                    activeFilters["as-hide"].delete(filterName);
                }

                updateUrls("as-hide", Array.from(activeFilters["as-hide"]).join(','));

                if (filterName === "ea" && isChecked) {
                    addEaMetadata();
                }
            });
        }

        window.addEventListener("popstate", () => {
            activeFilters = getASFilters();
            setFilterStates();
        });

        setFilterStates();
        addRowMetadata();
        modifyPageLinks();

        // Allow user to autocollapse the added category block just like any other
        ExtensionLayer.runInPageContext((collapseName, maxStep) => {
            /**
             * https://github.com/SteamDatabase/SteamTracking/blob/a4cdd621a781f2c95d75edecb35c72f6781c01cf/store.steampowered.com/public/javascript/searchpage.js#L927
             * InitAutocollapse
             */
            let prefs = GetCollapsePrefs();

            let block = $J(`.search_collapse_block[data-collapse-name="${collapseName}"]`);
            let collapsed;

            if (prefs[collapseName] !== undefined) {
                collapsed = prefs[collapseName];
            } else {
                prefs[collapseName] = collapsed = false;
            }

            collapsed = collapsed
                && !(block.find(".tab_filter_control.checked").length > 0)
                && $J(".js-reviews-score-lower").val() === "0"
                && $J(".js-reviews-score-upper").val() === maxStep
                && !$J(".js-reviews-count-lower").val()
                && !$J(".js-reviews-count-upper").val();

            block.children(".block_content").css("height", '');

            if (collapsed) {
                block.addClass("collapsed");
                block.children(".block_content").hide();
            }

            block.children(".block_header").on("click", () => {
                if (block.hasClass("collapsed")) {
                    prefs[collapseName] = false;
                    block.children(".block_content").slideDown("fast");
                } else {
                    prefs[collapseName] = true;
                    block.children(".block_content").slideUp("fast");
                }

                block.toggleClass("collapsed");
                SaveCollapsePrefs(prefs);
            });
        }, [ collapseName, maxStep.toString() ]);
    };

    SearchPageClass.prototype.observeChanges = function() {

        Messenger.addMessageListener("searchCompleted", filtersChanged => {
            let newResults = document.querySelectorAll(".search_result_row:not([data-as-review-count])");

            EarlyAccess.showEarlyAccess();
            Highlights.highlightAndTag(newResults);
            addRowMetadata(newResults);
            modifyPageLinks();
            applyFilters(filtersChanged ? document.querySelectorAll(".search_result_row") : newResults);
        });

        ExtensionLayer.runInPageContext(() => {

            /**
             * The handler set by this function is triggered when the page that infiniscroll will display has changed
             * https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L614
             */
            function setPageChangeHandler() {
                let controller = InitInfiniteScroll.oController;
                if (controller) {
                    let oldPageHandler = controller.m_fnPageChangedHandler;

                    controller.SetPageChangedHandler(function() {
                        oldPageHandler(...arguments);

                        Messenger.postMessage("searchCompleted", false);
                    });
                }
            }

            // https://github.com/SteamDatabase/SteamTracking/blob/8a120c6dc568670d718f077c735b321a1ac80a29/store.steampowered.com/public/javascript/searchpage.js#L264
            let searchOld = window.ExecuteSearch;

            window.ExecuteSearch = function(params) {
                /**
                 * The ExecuteSearch function uses the global object g_rgCurrentParameters, that is
                 * filled by GatherSearchParameters(), and compares it to the new search parameters
                 * (the object passed to this function).
                 * If it detects that the two objects are different, it triggers a search request.
                 * Since the AS filters are all clientside, we don't want to do that and remove
                 * our added entries from the objects here.
                 * https://github.com/SteamDatabase/SteamTracking/blob/8a120c6dc568670d718f077c735b321a1ac80a29/store.steampowered.com/public/javascript/searchpage.js#L273
                 */

                let paramsCopy = {};
                Object.assign(paramsCopy, params);

                let currentAsParameters = {};
                let asParameters = {};

                for (let filter in g_rgCurrentParameters) {
                    if (filter.startsWith("as-")) {
                        currentAsParameters[filter] = g_rgCurrentParameters[filter];
                        delete g_rgCurrentParameters[filter];
                    }
                }

                for (let filter in params) {
                    if (filter.startsWith("as-")) {
                        asParameters[filter] = params[filter];
                        delete params[filter];
                    }
                }

                /**
                 * If our parameters have changed (this automatically means theirs have not, since
                 * during different states there is only one change in parameters), there won't be new results.
                 * Therefore we can already notify the content script that the search completed.
                 */
                if (Object.toQueryString(currentAsParameters) !== Object.toQueryString(asParameters)) {
                        Messenger.postMessage("searchCompleted", true);
                }

                searchOld(params);

                // Restore state such that the next comparison includes AS filters
                g_rgCurrentParameters = paramsCopy;
            };

            // https://github.com/SteamDatabase/SteamTracking/blob/8a120c6dc568670d718f077c735b321a1ac80a29/store.steampowered.com/public/javascript/searchpage.js#L298
            let searchCompletedOld = window.SearchCompleted;

            window.SearchCompleted = function() {
                searchCompletedOld(...arguments);

                // https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L319
                setPageChangeHandler();

                // At this point the new results have been loaded and decorated (by the Dynamic Store)
                Messenger.postMessage("searchCompleted", false);
            };

            // https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L463
            setPageChangeHandler();

        });
    };

    return SearchPageClass;
})();

let StatsPageClass = (function(){

    function StatsPageClass() {
        this.highlightTopGames();
    }

    StatsPageClass.prototype.highlightTopGames = function() {
        return Highlights.highlightAndTag(document.querySelectorAll(".gameLink"), false);
    }

    return StatsPageClass;
})();


let WishlistPageClass = (function(){

    let cachedPrices = {};
    let userNotes;
    let myWishlist;

    function WishlistPageClass() {

        let that = this;
        userNotes = new UserNotes();
        myWishlist = isMyWishlist();

        let container = document.querySelector("#wishlist_ctn");
        let timeout = null, lastRequest = null;
        let delayedWork = new Set();
        let observer = new MutationObserver(mutations => {
            mutations.forEach(record => {
                if (record.addedNodes.length === 1) {
                    delayedWork.add(record.addedNodes[0]);
                }
            });
            lastRequest = window.performance.now();
            if (timeout === null) {
                timeout = window.setTimeout(async function markWishlist() {
                    if (window.performance.now() - lastRequest < 40) {
                        timeout = window.setTimeout(markWishlist, 50);
                        return;
                    }
                    timeout = null;
                    let promises = [];
                    for (let node of delayedWork) {
                        delayedWork.delete(node);
                        if (node.parentNode !== container) { // Valve detaches wishlist entries that aren't visible
                            continue;
                        }
                        if (myWishlist && SyncedStorage.get("showusernotes")) {
                            promises.push(that.addUserNote(node));
                        }
                        that.highlightApps(node);
                        that.addPriceHandler(node);
                    }
                    await Promise.all(promises);
                    window.dispatchEvent(new Event("resize"));
                }, 50);
            }
        });

        if (SyncedStorage.get("showlowestprice_onwishlist")) {

            ExtensionLayer.runInPageContext(() => {
                function getNodesBelow(node) {
                    let nodes = Array.from(document.querySelectorAll(".wishlist_row"));

                    // Limit the selection to the rows that are positioned below the row (not including the row itself) where the price is being shown
                    return nodes.filter(row => parseInt(row.style.top, 10) > parseInt(node.style.top, 10));
                }

                let oldOnScroll = CWishlistController.prototype.OnScroll;

                CWishlistController.prototype.OnScroll = function() {
                    oldOnScroll.call(g_Wishlist);

                    // If the mouse is still inside an entry while scrolling or resizing, wishlist.js's event handler will put back the elements to their original position
                    let hover = document.querySelectorAll(":hover");
                    if (hover.length) {
                        let activeEntry = hover[hover.length - 1].closest(".wishlist_row");
                        if (activeEntry) {
                            let priceNode = activeEntry.querySelector(".itad-pricing");

                            if (priceNode) {
                                for (let row of getNodesBelow(activeEntry)) {
                                    row.style.top = `${parseInt(row.style.top) + priceNode.getBoundingClientRect().height}px`;
                                }
                            }
                        }
                    }
                }

            });
        }

        observer.observe(container, { 'childList': true, });

        let wishlistLoaded = () => {
            this.computeStats();
            this.addExportWishlistButton();
            this.addEmptyWishlistButton();
            this.addUserNotesHandlers();
        };

        if (document.querySelector("#throbber").style.display === "none") {
            wishlistLoaded();
        } else {
            ExtensionLayer.runInPageContext(() => new Promise(resolve => {
                $J(document).ajaxSuccess((e, xhr, settings) => {
                    let url = new URL(settings.url);
                    if (url.origin + url.pathname === `${g_strWishlistBaseURL}wishlistdata/` && g_Wishlist.nPagesToLoad === g_Wishlist.nPagesLoaded) {
                        resolve();
                    }
                });
            }), null, "wishlistLoaded")
            .then(() => { wishlistLoaded(); });
        }
    }

    function isMyWishlist() {
        if (!User.isSignedIn) { return false; }

        let myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
        let myWishlistUrlRegex = new RegExp("^" + myWishlistUrl + "([/#]|$)");
        return myWishlistUrlRegex.test(window.location.href)
            || window.location.href.includes("/profiles/" + User.steamId);
    }

    WishlistPageClass.prototype.highlightApps = function(node) {
        if (!User.isSignedIn) { return; }

        let options = {};
        if (myWishlist) {
            options.wishlisted = false;
            options.waitlisted = false;
        }

        return Highlights.highlightAndTag([node], false, options);
    };

    WishlistPageClass.prototype.computeStats = async function() {
        if (!SyncedStorage.get("showwishliststats")) { return; }
        if (document.getElementById("nothing_to_see_here").style.display !== "none") { return; }

        let appInfo = await ExtensionLayer.runInPageContext(() => g_rgAppInfo, null, "appInfo");

        let totalPrice = 0;
        let totalCount = 0;
        let totalOnSale = 0;
        let totalNoPrice = 0;

        for (let data of Object.values(appInfo)) {
            if (data.subs.length > 0) {
                totalPrice += data.subs[0].price;

                if (data.subs[0].discount_pct > 0) {
                    totalOnSale++;
                }
            } else {
                totalNoPrice++;
            }
            totalCount++;
        }
        totalPrice = new Price(totalPrice / 100);

        HTML.beforeBegin("#wishlist_ctn",
            `<div id="esi-wishlist-chart-content">
                <div class="esi-wishlist-stat"><span class="num">${totalPrice}</span>${Localization.str.wl.total_price}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalCount}</span>${Localization.str.wl.in_wishlist}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalOnSale}</span>${Localization.str.wl.on_sale}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalNoPrice}</span>${Localization.str.wl.no_price}</div>
            </div>`);
    }

    WishlistPageClass.prototype.addEmptyWishlistButton = function() {
        if (!myWishlist || !SyncedStorage.get("showemptywishlist")) { return; }

        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${Localization.str.empty_wishlist.title}</div>`);

        document.querySelector("#es_empty_wishlist").addEventListener("click", () => {
            emptyWishlist();
        });
    };

    async function emptyWishlist() {

        function removeApp(appid) {

            let formData = new FormData();
            formData.append("sessionid", User.getSessionId());
            formData.append("appid", appid);

            let url = `https://store.steampowered.com/wishlist/profiles/${User.steamId}/remove/`;
            return RequestData.post(url, formData);
        }

        await ExtensionLayer.runInPageContext(emptyWishlist => {
            let prompt = ShowConfirmDialog(emptyWishlist.title, emptyWishlist.confirm);

            return new Promise(resolve => {
                prompt.done(result => {
                    if (result === "OK") {
                        ShowBlockingWaitDialog(emptyWishlist.title, emptyWishlist.removing.replace("__cur__", 1).replace("__total__", g_rgWishlistData.length));
                        resolve();
                    }
                });
            });
        }, [ Localization.str.empty_wishlist ], "emptyWishlist");

        let wishlistData = HTMLParser.getVariableFromDom("g_rgWishlistData", "array");
        if (!wishlistData) { return; }

        let cur = 1;
        let textNode = document.querySelector(".waiting_dialog_throbber").nextSibling;
        for (let { appid } of wishlistData) {
            textNode.textContent = Localization.str.empty_wishlist.removing.replace("__cur__", cur++).replace("__total__", wishlistData.length);
            await removeApp(appid);
        }
        DynamicStore.clear();
        location.reload();
    }

    class WishlistExporter {

        constructor(appInfo, apps) {
            this.appInfo = appInfo;
            this.apps = apps;
            this.notes = SyncedStorage.get("user_notes") || {};
        }

        toJson() {
            let json = {
                version: "03",
                data: []
            };

            for (let [appid, data] of Object.entries(this.appInfo)) {
                json.data.push({
                    gameid: ["steam", `app/${appid}`],
                    title: data.name,
                    url: `https://store.steampowered.com/app/${appid}/`,
                    type: data.type,
                    release_date: data.release_string,
                    note: this.notes[appid] || null,
                    price: data.subs[0] ? data.subs[0].price : null,
                    discount: data.subs[0] ? data.subs[0].discount_pct : 0,
                });
            }

            return JSON.stringify(json, null, 4);
        }

        toText(format) {
            let result = [];
            let parser = new DOMParser();
            for (let appid of this.apps) {
                let data = this.appInfo[appid];
                let price = "N/A";
                let discount = "0%";
                let base_price = "N/A";

                // if it has a price (steam always picks first sub, see https://github.com/SteamDatabase/SteamTracking/blob/f3f38deef1f1a8c6bf5707013adabde3ed873620/store.steampowered.com/public/javascript/wishlist.js#L292)
                if (data.subs[0]) {
                    let block = parser.parseFromString(data.subs[0].discount_block, "text/html");
                    price = block.querySelector(".discount_final_price").innerText;

                    // if it is discounted
                    if (data.subs[0].discount_pct > 0) {
                        discount = block.querySelector(".discount_pct").innerText;
                        base_price = block.querySelector(".discount_original_price").innerText;
                    } else {
                        base_price = block.querySelector(".discount_final_price").innerText;
                    }
                }

                result.push(
                    format
                        .replace("%appid%", appid)
                        .replace("%id%", `app/${appid}`)
                        .replace("%url%", `https://store.steampowered.com/app/${appid}/`)
                        .replace("%title%", data.name)
                        .replace("%release_date%", data.release_string)
                        .replace("%price%", price)
                        .replace("%discount%", discount)
                        .replace("%base_price%",  base_price)
                        .replace("%type%", data.type)
                        .replace("%note%", this.notes[appid] || "")
                );
            }

            return result.join("\n");
        }
    }
    WishlistExporter.method = Object.freeze({"download": Symbol("Download"), "copyToClipboard": Symbol("Copy to clipboard")});

    /**
     * Using Valve's CModal API here is very hard, since, when trying to copy data to the clipboard, it has to originate from
     * a short-lived event handler for a user action.
     * Since we'd use our Messenger class to pass information in between these two contexts, we would "outrange" this specific event
     * handler, resulting in a denial of access to the clipboard function.
     * This could be circumvented by adding the appropriate permissions, but doing so would prompt users to explicitly accept the changed
     * permissions on an update.
     *
     * If we don't use the Messenger, we'd have to move the whole handler part (including WishlistExporter) to
     * the page context side.
     *
     * Final solution is to query the action buttons of the dialog and adding some extra click handlers on the content script side.
     * These handlers are using a capture, so that the dialog elements will still be existent at the time of the invocation.
     */
    WishlistPageClass.prototype.showExportModalDialog = function(appInfo, apps) {

        ExtensionLayer.runInPageContext(exportStr => {
            ShowConfirmDialog(
                exportStr.wishlist,
                `<div id='es_export_form'>
                    <div class="es-wexport">
                    <h2>${exportStr.type}</h2>
                    <div>
                        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="text" checked> ${exportStr.text}</label>
                        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="json"> JSON</label>
                    </div>
                    </div>

                    <div class="es-wexport es-wexport__format">
                        <h2>${exportStr.format}</h2>
                        <div>
                            <input type="text" id="es-wexport-format" class="es-wexport__input" value="%title%"><br>
                            <div class="es-wexport__symbols">%title%, %id%, %appid%, %url%, %release_date%, %price%, %discount%, %base_price%, %type%, %note%</div>
                        </div>
                    </div>
                </div>`,
                exportStr.download,
                null, // use default "Cancel"
                exportStr.copy_clipboard
            );
        }, [ Localization.str.export ]);

        let [ dlBtn, copyBtn ] = document.querySelectorAll(".newmodal_buttons > .btn_medium");

        dlBtn.classList.remove("btn_green_white_innerfade");
        dlBtn.classList.add("btn_darkblue_white_innerfade");

        dlBtn.addEventListener("click", () => exportWishlist(WishlistExporter.method.download), true);
        copyBtn.addEventListener("click", () => exportWishlist(WishlistExporter.method.copyToClipboard), true);

        let format = document.querySelector(".es-wexport__format");
        for (let el of document.getElementsByName("es_wexport_type")) {
            el.addEventListener("click", e => format.style.display = e.target.value === "json" ? "none" : '');
        }

        function exportWishlist(method) {
            let type = document.querySelector("input[name='es_wexport_type']:checked").value;
            let format = document.querySelector("#es-wexport-format").value;

            let wishlist = new WishlistExporter(appInfo, apps);

            let result = "";
            let filename = "";
            let filetype = "";
            if (type === "json") {
                result = wishlist.toJson();
                filename = "wishlist.json";
                filetype = "application/json";
            } else if (type === "text" && format) {
                result = wishlist.toText(format);
                filename = "wishlist.txt";
                filetype = "text/plain";
            }

            if (method === WishlistExporter.method.copyToClipboard) {
                Clipboard.set(result);
            } else if (method === WishlistExporter.method.download) {
                Downloader.download(new Blob([result], { type: `${filetype};charset=UTF-8` }), filename);
            }
        }
    };

    WishlistPageClass.prototype.addExportWishlistButton = function() {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_export_wishlist"><div>${Localization.str.export.wishlist}</div></div>`);

        document.querySelector("#es_export_wishlist").addEventListener("click", async () => {
            this.showExportModalDialog(
                await ExtensionLayer.runInPageContext(() => g_rgAppInfo, null, "appInfo"), 
                await ExtensionLayer.runInPageContext(() => g_Wishlist.rgAllApps, null, "apps")
            );
        });
    };

    function getNodesBelow(node) {
        let nodes = Array.from(document.querySelectorAll(".wishlist_row"));

        // Limit the selection to the rows that are positioned below the row (not including the row itself) where the price is being shown
        return nodes.filter(row => parseInt(row.style.top, 10) > parseInt(node.style.top, 10));
    }

    WishlistPageClass.prototype.addPriceHandler = function(node) {
        if (!SyncedStorage.get("showlowestprice_onwishlist")) { return; }

        let appId = node.dataset.appId;
        if (!appId || typeof cachedPrices[appId] !== "undefined") { return; }

        cachedPrices[appId] = null;

        node.addEventListener("mouseenter", () => {
            if (cachedPrices[appId] === null) {
                cachedPrices[appId] = new Promise(resolve => {
                    let prices = new Prices();
                    prices.appids = [appId];
                    prices.priceCallback = (type, id, contentNode) => {
                        node.insertAdjacentElement("beforeend", contentNode);
                        let priceNode = node.querySelector(".itad-pricing");
                        priceNode.style.bottom = -priceNode.getBoundingClientRect().height + "px";
                        resolve();
                    };
                    prices.load();
                });
            }
            cachedPrices[appId].then(() => {
                    let priceNodeHeight = node.querySelector(".itad-pricing").getBoundingClientRect().height;
                    getNodesBelow(node).forEach(row => row.style.top = parseInt(row.style.top, 10) + priceNodeHeight + "px");
            });
        });

        node.addEventListener("mouseleave", () => {
            // When scrolling really fast, sometimes only this event is called without the invocation of the mouseenter event
            if (cachedPrices[appId]) {
                cachedPrices[appId].then(() => {
                    let priceNodeHeight = node.querySelector(".itad-pricing").getBoundingClientRect().height;
                    getNodesBelow(node).forEach(row => row.style.top = parseInt(row.style.top, 10) - priceNodeHeight + "px");
                });
            }
        });
    };

    WishlistPageClass.prototype.addUserNote = async function(node) {
        if (node.classList.contains("esi-has-note")) { return; }

        let appid = Number(node.dataset.appId);
        let noteText;
        let cssClass;
        if (await userNotes.exists(appid)) {
            noteText = `"${await userNotes.get(appid)}"`;
            cssClass = "esi-user-note";
        } else {
            noteText = Localization.str.user_note.add;
            cssClass = "esi-empty-note";
        }

        HTML.afterEnd(node.querySelector(".mid_container"),
            `<div class="esi-note ${cssClass}">${noteText}</div>`);
        node.classList.add("esi-has-note");
    };

    WishlistPageClass.prototype.addUserNotesHandlers = function() {
        if (!myWishlist) { return; }

        let stateHandler = function(node, active) {
            if (active) {
                node.classList.remove("esi-empty-note");
                node.classList.add("esi-user-note");
            } else {
                node.classList.remove("esi-user-note");
                node.classList.add("esi-empty-note");
            }
        };

        document.addEventListener("click", e => {
            if (!e.target.classList.contains("esi-note")) { return; }

            let row = e.target.closest(".wishlist_row");
            let appid = Number(row.dataset.appId);
            userNotes.showModalDialog(row.querySelector("a.title").textContent.trim(), appid, `.wishlist_row[data-app-id="${appid}"] div.esi-note`, stateHandler);
        });
    };

    return WishlistPageClass;
})();

class UserNotes {
    constructor() {

        this._notes = SyncedStorage.get("user_notes") || {};

        this.noteModalTemplate = `
            <div id="es_note_modal" data-appid="__appid__" data-selector="__selector__">
                <div id="es_note_modal_content">
                    <div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                        <textarea name="es_note_input" id="es_note_input" rows="6" cols="12" maxlength="512">__note__</textarea>
                    </div>
                    <div class="es_note_buttons" style="float: right">
                        <div class="es_note_modal_submit btn_green_white_innerfade btn_medium">
                            <span>${Localization.str.save}</span>
                        </div>
                        <div class="es_note_modal_close btn_grey_white_innerfade btn_medium">
                            <span>${Localization.str.cancel}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // TODO data functions should probably be split from presentation, but splitting it to background seems unneccessary
    get(appid) {
        return this._notes[appid];
    };

    set(appid, note) {
        this._notes[appid] = note;
        SyncedStorage.set("user_notes", this._notes);
    };

    delete(appid) {
        delete this._notes[appid];
        SyncedStorage.set("user_notes", this._notes);
    };

    exists(appid) {
        return Boolean(this._notes[appid]);
    };

    async showModalDialog(appname, appid, nodeSelector, onNoteUpdate) {
        // Partly copied from shared_global.js
        let bgClick = ExtensionLayer.runInPageContext((title, template) => {
            let deferred = new jQuery.Deferred();
            let fnOK = () => deferred.resolve();

            let Modal = _BuildDialog(title, template, [], fnOK);
            deferred.always(() => Modal.Dismiss());

            let promise = new Promise(resolve => {
                Modal.m_fnBackgroundClick = () => {
                    Messenger.onMessage("noteSaved").then(() => { Modal.Dismiss(); });
                    resolve();
                };
            });

            Modal.Show();

            // attach the deferred's events to the modal
            deferred.promise(Modal);

            let note_input = document.getElementById("es_note_input");
            note_input.focus();
            note_input.setSelectionRange(0, note_input.textLength);
            note_input.addEventListener("keydown", e => {
                if (e.key === "Enter") {
                    $J(".es_note_modal_submit").click();
                } else if (e.key === "Escape") {
                    Modal.Dismiss();
                }
            });

            return promise;
        },
        [
            Localization.str.user_note.add_for_game.replace("__gamename__", appname),
            this.noteModalTemplate.replace("__appid__", appid).replace("__note__", await this.get(appid) || '').replace("__selector__", encodeURIComponent(nodeSelector)),
        ], "backgroundClick");

        document.addEventListener("click", clickListener);

        bgClick.then(() => {
            onNoteUpdate.apply(null, saveNote());
            Messenger.postMessage("noteSaved");
        });

        function clickListener(e) {
            if (e.target.closest(".es_note_modal_submit")) {
                e.preventDefault();
                onNoteUpdate.apply(null, saveNote());
                ExtensionLayer.runInPageContext(() => { CModal.DismissActiveModal(); });
            }
            else if (e.target.closest(".es_note_modal_close")) {
                ExtensionLayer.runInPageContext(() => { CModal.DismissActiveModal(); });
            }
            else {
                return;
            }
            document.removeEventListener("click", clickListener);
        }

        let saveNote = () => {
            let modal = document.querySelector("#es_note_modal");
            let appid = parseInt(modal.dataset.appid, 10);
            let note = HTML.escape(modal.querySelector("#es_note_input").value.trim().replace(/\s\s+/g, " ").substring(0, 512));
            let node = document.querySelector(decodeURIComponent(modal.dataset.selector));
            if (note.length !== 0) {
                this.set(appid, note);
                HTML.inner(node, `"${note}"`);
                return [node, true];
            }
            else {
                this.delete(appid);
                node.textContent = Localization.str.user_note.add;
                return [node, false];
            }
        }
    }
}


let StoreFrontPageClass = (function(){

    function StoreFrontPageClass() {

        if (User.isSignedIn) {
            this.highlightDynamic();
        }

        this.setHomePageTab();
        this.customizeHomePage();
    }

    StoreFrontPageClass.prototype.setHomePageTab = function(){
        document.querySelector(".home_tabs_row").addEventListener("click", function(e) {
            let tab = e.target.closest(".tab_content");
            if (!tab) { return; }
            SyncedStorage.set("homepage_tab_last", tab.parentNode.id);
        });

        let setting = SyncedStorage.get("homepage_tab_selection");
        let last = setting;
        if (setting === "remember") {
            last = SyncedStorage.get("homepage_tab_last");
        }
        if (!last) { return; }

        let tab = document.querySelector(".home_tabs_row #"+last);
        if (!tab) { return; }

        tab.click();
    };

    StoreFrontPageClass.prototype.highlightDynamic = function() {

        let recentlyUpdated = document.querySelector(".recently_updated");
        if (recentlyUpdated) {
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => Highlights.highlightAndTag(mutation.addedNodes[0].children));
                observer.disconnect();
            });
            observer.observe(recentlyUpdated, { childList: true });
        }

        // Monitor and highlight wishlishted recommendations at the bottom of Store's front page
        let contentNode = document.querySelector("#content_more");
        if (contentNode) {
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation =>
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType !== Node.ELEMENT_NODE) { return; }
                        Highlights.highlightAndTag(node.querySelectorAll(".home_content_item, .home_content.single"));
                    })
                );
            });

            observer.observe(contentNode, {childList:true, subtree: true});
        }
    };

    StoreFrontPageClass.prototype.customizeHomePage = function(){

        HTML.beforeEnd(".home_page_content",
            `<div class="home_pagecontent_ctn clearfix" style="margin-bottom: 5px; margin-top: 3px;">
                <div id="es_customize_btn" class="home_actions_ctn">
                    <div class="home_btn home_customize_btn" style="z-index: 13;">${Localization.str.customize}</div>
                    <div class='home_viewsettings_popup'>
                        <div class='home_viewsettings_instructions' style='font-size: 12px;'>${Localization.str.apppage_sections}</div>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_customize_btn").addEventListener("click", function(e){
            e.target.classList.toggle("active");
        });

        document.body.addEventListener("click", function(e){
            if (e.target.closest("#es_customize_btn")) { return; }
            let node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }
            node.classList.remove("active");
        });

        setTimeout(() => {
            let specialoffers = document.querySelector(".special_offers");
            let browsesteam = document.querySelector(".big_buttons.home_page_content");
            let recentlyupdated = document.querySelector(".recently_updated_block");
            let under = document.querySelector("[class*='specials_under']");

            let customizer = new Customizer("customize_frontpage");
            customizer
                .add("featuredrecommended", ".home_cluster_ctn")
                .add("trendingamongfriends", ".friends_recently_purchased")
                .add("discoveryqueue", ".discovery_queue_ctn")
                .add("curators", ".steam_curators_ctn", Localization.str.homepage_curators)
                .add("morecuratorrecommendations", ".apps_recommended_by_curators_ctn", Localization.str.homepage_curators)
                .add("fromdevelopersandpublishersthatyouknow", ".recommended_creators_ctn")
                .add("popularvrgames", ".best_selling_vr_ctn")
                .add("homepagetabs", ".tab_container", Localization.str.homepage_tabs)
                .add("gamesstreamingnow", ".live_streams_ctn", "", true)
                .add("updatesandoffers", ".marketingmessage_area", "", true)
                .add("topnewreleases", ".top_new_releases", Localization.str.homepage_topnewreleases)
                .add("steamlabs", ".labs_cluster")
                .add("homepagesidebar", "body:not(.no_home_gutter) .home_page_gutter", Localization.str.homepage_sidebar);

            if (specialoffers) customizer.add("specialoffers", specialoffers.parentElement);
            if (browsesteam) customizer.add("browsesteam", browsesteam.parentElement);
            if (recentlyupdated) customizer.add("recentlyupdated", recentlyupdated.parentElement);
            if (under) customizer.add("under", under.parentElement.parentElement);

            let dynamicNodes = document.querySelectorAll(".home_page_body_ctn .home_ctn:not(.esi-customizer), .home_pagecontent_ctn");
            for (let node of dynamicNodes) {
                if (node.closest(".esi-customizer") || node.querySelector(".esi-customizer") || node.style.display === "none") { continue; }

                customizer.addDynamic(node);
            }

            customizer.build();
        }, 1000);
    };

    return StoreFrontPageClass;
})();

let TabAreaObserver = (function(){
    let self = {};

    self.observeChanges = function() {

        let tabAreaNodes = document.querySelectorAll(".tag_browse_ctn, .tabarea, .browse_ctn_background");
        if (!tabAreaNodes) { return; }

        let observer = new MutationObserver(() => {
            Highlights.startHighlightsAndTags();
            EarlyAccess.showEarlyAccess();
        });

        tabAreaNodes.forEach(tabAreaNode => observer.observe(tabAreaNode, {childList: true, subtree: true}));
    };

    return self;
})();

(async function(){
    if (!document.getElementById("global_header")) { return; }

    let path = window.location.pathname.replace(/\/+/g, "/");

    await SyncedStorage.init().catch(err => console.error(err));
    await Promise.all([Localization, User, Currency]);

    Common.init();

    switch (true) {
        case /\bagecheck\b/.test(path):
            AgeCheck.sendVerification();
            break;

        case /^\/app\/.*/.test(path):
            new CAppPage(window.location.host + path);
            break;

        case /^\/sub\/.*/.test(path):
            (new SubPageClass(window.location.host + path));
            break;

        case /^\/bundle\/.*/.test(path):
            (new BundlePageClass(window.location.host + path));
            break;

        case /^\/account\/registerkey(\/.*)?$/.test(path):
            (new RegisterKeyPageClass());
            return;

        case /^\/account(\/)?$/.test(path):
            (new AccountPageClass());
            return;

        // Match URLs like https://store.steampowered.com/steamaccount/addfundskjdsakjdsakjkjsa since they are still valid
        case /^\/(steamaccount\/addfunds|digitalgiftcards\/selectgiftcard(\/.*)?$)/.test(path):
            (new FundsPageClass());
            break;

        case /^\/search(\/.*)?$/.test(path):
            (new SearchPageClass());
            break;

        case /^\/stats(\/.*)?$/.test(path):
            (new StatsPageClass());
            break;

        case /^\/sale\/.*/.test(path):
            (new StorePageClass()).showRegionalPricing("sale");
            break;

        case /^\/wishlist\/(?:id|profiles)\/.+(\/.*)?/.test(path):
            (new WishlistPageClass());
            break;

        // Storefront-front only
        case /^\/$/.test(path):
            (new StoreFrontPageClass());
            break;
    }

    // common for store pages
    Highlights.startHighlightsAndTags();
    AugmentedSteam.alternateLinuxIcon();
    AugmentedSteam.hideTrademarkSymbol(false);
    TabAreaObserver.observeChanges();

})();
