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
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Workshop from "./Workshop";
import Feature from "@Content/Modules/Context/Feature";
import type CWorkshopBrowse from "@Content/Features/Community/WorkshopBrowse/CWorkshopBrowse";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";

export default class FWorkshopSubscriberButtons extends Feature<CWorkshopBrowse> {

    private _method: string = "";
    private _total: number = 0;
    private _completed: number = 0;
    private _failed: number = 0;
    private _statusTitle: string = "";

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn
            && document.querySelector(".workshopBrowseItems") !== null
            && document.querySelector(".workshopBrowsePagingInfo") !== null;
    }

    override apply(): void {
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

        document.getElementById("es_subscriber_container")!.addEventListener("click", ({target}) => {
            this._method = (<HTMLElement>target).closest<HTMLElement>(".es_subscriber")!.dataset.method ?? "";
            const pagingInfo = document.querySelector(".workshopBrowsePagingInfo")!.textContent!;

            const matches = pagingInfo.replace(/,/g, "").match(/\d+/g)?.map(Number) ?? [0];
            this._total = Math.max(...matches);

            this.startSubscriber();
        });
    }

    private async startSubscriber() {

        this._completed = 0;
        this._failed = 0;

        this._statusTitle = L(this._method === "subscribe" ? __workshop_subscribeAll : __workshop_unsubscribeAll);
        const statusString = L(this._method === "subscribe" ? __workshop_subscribeConfirm : __workshop_unsubscribeConfirm, {
            "count": this._total
        });

        if (await SteamFacade.showConfirmDialog(this._statusTitle, statusString) !== "OK") {
            return;
        }

        const waitDialog = new BlockingWaitDialog(
            this._statusTitle,
            () => this.getStatus()
        );
        await waitDialog.update();

        const parser = new DOMParser();
        const url = new URL(window.location.href);
        url.searchParams.set("numperpage", "30");

        const workshopItems = [];
        for (let p = 1; p <= Math.ceil(this._total / 30); p++) {
            url.searchParams.set("p", String(p));

            const result = await RequestData.getText(url)
                .catch(e => console.error(e));

            if (!result) {
                console.error(`Failed to request ${url}`);
                continue;
            }

            const doc = parser.parseFromString(result, "text/html");
            for (let node of doc.querySelectorAll(".workshopItem")) {
                const subNode = node.querySelector<HTMLElement>(".user_action_history_icon.subscribed");
                if (!subNode || this.canSkip(subNode)) { continue; }

                node = node.querySelector(".workshopItemPreviewHolder")!;
                workshopItems.push(node.id.replace("sharedfile_", ""));
            }
        }

        this._total = workshopItems.length;
        await waitDialog.update();

        const workshop = new Workshop(this.context.user);
        const promises = workshopItems.map(
            id => workshop.changeSubscription(id, this.context.appid!, this._method)
                .catch(err => {
                    this._failed++;
                    console.error(err);
                })
                .finally(() => {
                    this._completed++;
                    return waitDialog.update();
                })
        );

        Promise.all(promises).finally(() => {
            waitDialog.dismiss();
            this.showResults();
        });
    }

    private async showResults(): Promise<void> {

        const statusString = L(__workshop_finished, {
            "success": this._completed - this._failed,
            "fail": this._failed
        });

        const result = await SteamFacade.showConfirmDialog(this._statusTitle, statusString);
        if (result === "OK") {
            window.location.reload();
        }
    }

    private canSkip(node: HTMLElement): boolean {

        if (this._method === "subscribe") {
            return node && node.style.display !== "none";
        }

        if (this._method === "unsubscribe") {
            return !node || node.style.display === "none";
        }

        return false;
    }

    private getStatus(): string[] {
        const status = [];

        status.push(L(this._method === "subscribe" ? __workshop_subscribeLoading : __workshop_unsubscribeLoading, {
            "i": this._completed,
            "count": this._total
        }));

        if (this._failed > 0) {
            status.push(L(__workshop_failed, {"n": this._failed}));
        }

        return status;
    }
}
