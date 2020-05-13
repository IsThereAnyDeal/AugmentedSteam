
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

class StorePageClass {}

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
            new CSubPage(window.location.host + path);
            break;

        case /^\/bundle\/.*/.test(path):
            new CBundlePage(window.location.host + path);
            break;

        case /^\/account\/registerkey(\/.*)?$/.test(path):
            new CRegisterKeyPage();
            return;

        case /^\/account(\/)?$/.test(path):
            new CAccountPage();
            return;

        // Match URLs like https://store.steampowered.com/steamaccount/addfundskjdsakjdsakjkjsa since they are still valid
        case /^\/(steamaccount\/addfunds|digitalgiftcards\/selectgiftcard(\/.*)?$)/.test(path):
            new CFundsPage();
            break;

        case /^\/search(\/.*)?$/.test(path):
            new CSearchPage();
            break;

        case /^\/stats(\/.*)?$/.test(path):
            new CStatsPage();
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
    AugmentedSteam.alternateLinuxIcon();
    AugmentedSteam.hideTrademarkSymbol(false);
    TabAreaObserver.observeChanges();

})();
