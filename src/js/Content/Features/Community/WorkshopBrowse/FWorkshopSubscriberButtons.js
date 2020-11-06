import {GameId, HTML, Localization} from "../../../../modulesCore";
import {Feature, RequestData, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FWorkshopSubscriberButtons extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        this._appid = GameId.getAppidUriQuery(window.location.search);
        if (!this._appid) { return; }

        const pagingInfo = document.querySelector(".workshopBrowsePagingInfo");
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

        const statusTitle = this._workshopStr[`${this._method}_all`];
        const statusString = this._workshopStr[`${this._method}_confirm`]
            .replace("__count__", this._total);

        // todo reject when dialog closed
        await Page.runInPageContext((title, confirm) => {
            const prompt = window.SteamFacade.showConfirmDialog(title, confirm);

            return new Promise(resolve => {
                prompt.done(result => {
                    if (result === "OK") {
                        resolve();
                    }
                });
            });

        }, [statusTitle, statusString], "startSubscriber");

        this._updateWaitDialog();

        const parser = new DOMParser();
        const workshopItems = [];
        for (let p = 1; p <= Math.ceil(this._total / 30); p++) {
            const url = new URL(window.location.href);
            url.searchParams.set("p", p);
            url.searchParams.set("numperpage", 30);

            const result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
            if (!result) {
                console.error(`Failed to request ${url.toString()}`);
                continue;
            }

            const xmlDoc = parser.parseFromString(result, "text/html");
            for (let node of xmlDoc.querySelectorAll(".workshopItem")) {
                const subNode = node.querySelector(".user_action_history_icon.subscribed");
                if (this._canSkip(subNode)) { continue; }

                node = node.querySelector(".workshopItemPreviewHolder");
                workshopItems.push(node.id.replace("sharedfile_", ""));
            }
        }

        this._total = workshopItems.length;
        this._updateWaitDialog();

        return Promise.all(workshopItems.map(id => this._changeSubscription(id)))
            .finally(() => { this._showResults(); });
    }

    _showResults() {

        const statusTitle = this._workshopStr[`${this._method}_all`];
        const statusString = this._workshopStr.finished
            .replace("__success__", this._completed - this._failed)
            .replace("__fail__", this._failed);

        Page.runInPageContext((title, finished) => {
            if (window.dialog) {
                // eslint-disable-next-line new-cap
                window.dialog.Dismiss();
            }

            window.dialog = window.SteamFacade.showConfirmDialog(title, finished)
                .done(result => {
                    if (result === "OK") {
                        window.location.reload();
                    }
                });
        }, [statusTitle, statusString]);
    }

    async _changeSubscription(id) {

        const formData = new FormData();
        formData.append("sessionid", User.sessionId);
        formData.append("appid", this._appid);
        formData.append("id", id);

        try {
            const res = await RequestData.post(`https://steamcommunity.com/sharedfiles/${this._method}`, formData, {"withCredentials": true}, true);

            if (!res || !res.success) {
                throw new Error("Bad response");
            }
        } catch (err) {
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

        let statusString = this._workshopStr[`${this._method}_loading`]
            .replace("__i__", this._completed)
            .replace("__count__", this._total);

        if (this._failed) {
            statusString += this._workshopStr.failed.replace("__n__", this._failed);
        }

        const modal = document.querySelector(".newmodal_content");
        if (modal) {
            modal.innerText = statusString;
        } else {
            const statusTitle = this._workshopStr[`${this._method}_all`];
            Page.runInPageContext((title, progress) => {
                if (window.dialog) {
                    // eslint-disable-next-line new-cap
                    window.dialog.Dismiss();
                }

                window.dialog = window.SteamFacade.showBlockingWaitDialog(title, progress);
            }, [statusTitle, statusString]);
        }
    }
}
