import {HTML, Localization} from "../../../../modulesCore";
import {ConfirmDialog, Feature, RequestData, User} from "../../../modulesContent";
import {Page} from "../../Page";
import Workshop from "../Workshop";

export default class FWorkshopSubscriberButtons extends Feature {

    checkPrerequisites() {
        return User.isSignedIn
            && document.querySelector(".workshopBrowseItems") !== null
            && document.querySelector(".workshopBrowsePagingInfo") !== null;
    }

    apply() {

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
            const pagingInfo = document.querySelector(".workshopBrowsePagingInfo").textContent;
            this._total = Math.max(...pagingInfo.replace(/,/g, "").match(/\d+/g));

            this._startSubscriber();
        });
    }

    async _startSubscriber() {

        this._completed = 0;
        this._failed = 0;

        this._statusTitle = this._workshopStr[`${this._method}_all`];
        const statusString = this._workshopStr[`${this._method}_confirm`]
            .replace("__count__", this._total);

        if (await ConfirmDialog.open(this._statusTitle, statusString) !== "OK") { return; }

        this._updateWaitDialog();

        const parser = new DOMParser();
        const url = new URL(window.location.href);
        url.searchParams.set("numperpage", 30);

        const workshopItems = [];
        for (let p = 1; p <= Math.ceil(this._total / 30); p++) {
            url.searchParams.set("p", p);

            const result = await RequestData.getHttp(url).catch(err => console.error(err));
            if (!result) {
                console.error(`Failed to request ${url}`);
                continue;
            }

            const doc = parser.parseFromString(result, "text/html");
            for (let node of doc.querySelectorAll(".workshopItem")) {
                const subNode = node.querySelector(".user_action_history_icon.subscribed");
                if (this._canSkip(subNode)) { continue; }

                node = node.querySelector(".workshopItemPreviewHolder");
                workshopItems.push(node.id.replace("sharedfile_", ""));
            }
        }

        this._total = workshopItems.length;
        this._updateWaitDialog();

        const promises = workshopItems.map(
            id => Workshop.changeSubscription(id, this.context.appid, this._method)
                .catch(err => {
                    this._failed++;
                    console.error(err);
                })
                .finally(() => {
                    this._completed++;
                    this._updateWaitDialog();
                })
        );

        Promise.all(promises).finally(() => { this._showResults(); });
    }

    _showResults() {

        const statusString = this._workshopStr.finished
            .replace("__success__", this._completed - this._failed)
            .replace("__fail__", this._failed);

        Page.runInPageContext((title, finished) => {
            window.SteamFacade.dismissActiveModal();
            window.SteamFacade.showConfirmDialog(title, finished)
                .done(result => {
                    if (result === "OK") {
                        window.location.reload();
                    }
                });
        }, [this._statusTitle, statusString]);
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

        if (this._failed > 0) {
            statusString += "<br>";
            statusString += this._workshopStr.failed.replace("__n__", this._failed);
        }

        const container = document.querySelector("#as_loading_text_ctn");
        if (container) {
            HTML.inner(container, statusString);
        } else {
            Page.runInPageContext((title, progress) => {
                window.SteamFacade.dismissActiveModal();
                window.SteamFacade.showBlockingWaitDialog(title, `<div id="as_loading_text_ctn">${progress}</div>`);
            }, [this._statusTitle, statusString]);
        }
    }
}
