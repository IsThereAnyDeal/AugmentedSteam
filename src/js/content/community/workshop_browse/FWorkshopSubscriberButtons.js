import {Feature} from "modules";

import {GameId, HTML, Localization} from "core";
import {ExtensionLayer, RequestData, User} from "common";

export default class FWorkshopSubscriberButtons extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        this._appid = GameId.getAppidUriQuery(window.location.search);
        if (!this._appid) { return; }

        let pagingInfo = document.querySelector(".workshopBrowsePagingInfo");
        if (!pagingInfo) { return; }

        this._workshopStr = Localization.str.workshop;

        HTML.beforeBegin(".panel > .rightSectionTopTitle",
            `<div class="rightSectionTopTitle">${this._workshopStr.subscriptions}:</div>
            <div id="es_subscriber_container" class="rightDetailsBlock">
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="subscribe">${this._workshopStr.subscribe_all}</a>
                    </div>
                </div>
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="unsubscribe">${this._workshopStr.unsubscribe_all}</a>
                    </div>
                </div>
                <hr>
            </div>`);

        document.getElementById("es_subscriber_container").addEventListener("click", ({target}) => {
            this._method = target.closest(".es_subscriber").dataset.method;
            this._total = Math.max(...pagingInfo.textContent.replace(/,/g, "").match(/\d+/g));

            this._startSubscriber();
        });
    }

    async _startSubscriber() {

        this._completed = 0;
        this._failed = 0;

        let statusTitle = this._workshopStr[this._method + "_all"];
        let statusString = this._workshopStr[this._method + "_confirm"]
            .replace("__count__", this._total);

        // todo reject when dialog closed
        await ExtensionLayer.runInPageContext((title, confirm) => {
            let prompt = ShowConfirmDialog(title, confirm);

            return new Promise(resolve => {
                prompt.done(result => {
                    if (result === "OK") {
                        resolve();
                    }
                });
            });
            
        }, [ statusTitle, statusString ], "startSubscriber");

        this._updateWaitDialog();

        let parser = new DOMParser();
        let workshopItems = [];
        for (let p = 1; p <= Math.ceil(this._total / 30); p++) {
            let url = new URL(window.location.href);
            url.searchParams.set("p", p);
            url.searchParams.set("numperpage", 30);

            let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
            if (!result) {
                console.error("Failed to request " + url.toString());
                continue;
            }

            let xmlDoc = parser.parseFromString(result, "text/html");
            for (let node of xmlDoc.querySelectorAll(".workshopItem")) {
                let subNode = node.querySelector(".user_action_history_icon.subscribed");
                if (this._canSkip(subNode)) { continue; }
            
                node = node.querySelector(".workshopItemPreviewHolder");
                workshopItems.push(node.id.replace("sharedfile_", ""))
            }
        }

        this._total = workshopItems.length;
        this._updateWaitDialog();

        return Promise.all(workshopItems.map(id => this._changeSubscription(id)))
            .finally(() => { this._showResults(); });
    }

    _showResults() {

        let statusTitle = this._workshopStr[this._method + "_all"];
        let statusString = this._workshopStr.finished
            .replace("__success__", this._completed - this._failed)
            .replace("__fail__", this._failed);

        ExtensionLayer.runInPageContext((title, finished) => {
            if (window.dialog) {
                window.dialog.Dismiss();
            }
            
            window.dialog = ShowConfirmDialog(title, finished)
                .done(result => {
                    if (result === "OK") {
                        window.location.reload();
                    }
                });
        }, [ statusTitle, statusString ]);
    }

    async _changeSubscription(id) {

        let formData = new FormData();
        formData.append("sessionid", User.getSessionId());
        formData.append("appid", this._appid);
        formData.append("id", id);

        try {
            const res = await RequestData.post("https://steamcommunity.com/sharedfiles/" + this._method, formData, {"withCredentials": true}, true);

            if (!res || !res.success) {
                throw new Error("Bad response");
            }
        } catch(err) {
            this._failed++;
            console.error(err);
        } finally {
            this._completed++;
            this._updateWaitDialog();
        }
    }

    _canSkip(node) {

        if (this._method === "subscribe") {
            return node && node.style.display !== "none";
        }

        if (this._method === "unsubscribe") {
            return !node || node.style.display === "none";
        }

        return false;
    }

    _updateWaitDialog() {

        let statusString = this._workshopStr[this._method + "_loading"]
            .replace("__i__", this._completed)
            .replace("__count__", this._total);

        if (this._failed) {
            statusString += this._workshopStr.failed.replace("__n__", this._failed);
        }

        let modal = document.querySelector(".newmodal_content");
        if (!modal) {
            let statusTitle = this._workshopStr[this._method + "_all"];
            ExtensionLayer.runInPageContext((title, progress) => {
                if (window.dialog) {
                    window.dialog.Dismiss();
                }
                
                window.dialog = ShowBlockingWaitDialog(title, progress);
            }, [ statusTitle, statusString ]);
        } else {
            modal.innerText = statusString;
        }
    }
}
