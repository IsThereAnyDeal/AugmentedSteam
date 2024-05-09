import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {
    __workshop_failed,
    __workshop_finished,
    __workshop_subscribeAll,
    __workshop_subscribeConfirm,
    __workshop_subscribeLoading,
    __workshop_subscriptions,
    __workshop_unsubscribeAll,
    __workshop_unsubscribeConfirm,
    __workshop_unsubscribeLoading,
} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
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
        HTML.beforeBegin(".panel > .rightSectionTopTitle",
            `<div class="rightSectionTopTitle">${L(__workshop_subscriptions)}:</div>
            <div id="es_subscriber_container" class="rightDetailsBlock">
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="subscribe">${L(__workshop_subscribeAll)}</a>
                    </div>
                </div>
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="unsubscribe">${L(__workshop_unsubscribeAll)}</a>
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

        this._statusTitle = L(this._method === "subscribe" ? __workshop_subscribeAll : __workshop_unsubscribeAll);
        const statusString = L(this._method === "subscribe" ? __workshop_subscribeConfirm : __workshop_unsubscribeConfirm, {
            "count": this._total
        });

        if (await SteamFacade.showConfirmDialog(this._statusTitle, statusString) !== "OK") {
            return;
        }

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

        const statusString = L(__workshop_finished, {
            "success": this._completed - this._failed,
            "fail": this._failed
        });

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

        let statusString = L(this._method === "subscribe" ? __workshop_subscribeLoading : __workshop_unsubscribeLoading, {
            "i": this._completed,
            "count": this._total
        });

        if (this._failed > 0) {
            statusString += "<br>";
            statusString += L(__workshop_failed, {"n": this._failed});
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
