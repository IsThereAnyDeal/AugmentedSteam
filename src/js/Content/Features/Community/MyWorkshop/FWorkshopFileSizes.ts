import {
    __calcWorkshopSize_calcFinished,
    __calcWorkshopSize_calcLoading,
    __calcWorkshopSize_calcSize,
    __calcWorkshopSize_fileSize,
    __calcWorkshopSize_totalSize,
    __workshop_failed,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CMyWorkshop from "@Content/Features/Community/MyWorkshop/CMyWorkshop";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import SteamCommunityApiFacade from "@Content/Modules/Facades/SteamCommunityApiFacade";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";

export default class FWorkshopFileSizes extends Feature<CMyWorkshop> {

    private _completed: number = 0;
    private _failed: number = 0;
    private _totalSize: number = 0;
    private _total: number = 0;

    override checkPrerequisites(): boolean {
        // Check if the user is signed in, viewing own profile, and has subscribed to at least one item
        return document.querySelector(".primary_panel") !== null
            && document.querySelector(".workshopBrowsePagingInfo") !== null;
    }

    override apply(): void {

        HTML.beforeEnd(".primary_panel",
            `<div class="menu_panel">
                <div class="rightSectionHolder">
                    <div class="rightDetailsBlock">
                        <span class="btn_grey_steamui btn_medium" id="es_calc_size">
                            <span>${L(__calcWorkshopSize_calcSize)}</span>
                        </span>
                    </div>
                </div>
            </div>`);

        document.getElementById("es_calc_size")!.addEventListener("click", () => {
            const pagingInfo = document.querySelector(".workshopBrowsePagingInfo")!.textContent!;
            const pages = pagingInfo.replace(/,/g, "").match(/\d+/g);
            if (pages) {
                this._total = Math.max(...[...pages.values()].map(Number));
                this._startCalculation();
            }
        });

        this._addFileSizes(); // Doesn't actually fetch any data unless total size has been calculated before
    }

    async _addFileSizes() {

        for (const node of document.querySelectorAll<HTMLElement>(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("as-has-filesize")) { continue; }

            const size = await this._getFileSize(node, true).catch(e => console.error(e));
            if (!size) { continue; }

            const str = L(__calcWorkshopSize_fileSize, {"size": this._getFileSizeStr(size)});
            HTML.beforeEnd(node.querySelector(".workshopItemSubscriptionDetails"), `<div class="workshopItemDate">${str}</div>`);
            node.classList.add("as-has-filesize");
        }
    }

    async _startCalculation() {

        this._completed = 0;
        this._failed = 0;
        this._totalSize = 0;

        const waitDialog = new BlockingWaitDialog(
            L(__calcWorkshopSize_calcSize),
            () => this.getStatus()
        );
        await waitDialog.update();

        const parser = new DOMParser();
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set("browsefilter", "mysubscriptions");
        url.searchParams.set("numperpage", "30");

        for (let p = 1; p <= Math.ceil(this._total / 30); p++) {
            url.searchParams.set("p", String(p));

            let result: string|null = null;
            try {
                result = await RequestData.getText(url)
            } catch (e) {
                console.error(e);
                console.error(`Failed to request ${url}`);
                continue;
            }

            const doc = parser.parseFromString(result, "text/html");
            for (const node of doc.querySelectorAll<HTMLElement>(".workshopItemSubscription[id*=Subscription]")) {
                try {
                    const size = await this._getFileSize(node) ?? 0;

                    this._completed++;
                    this._totalSize += size;
                } catch (err) {
                    this._failed++;
                    console.error(err);
                } finally {
                    await waitDialog.update();
                }
            }
        }

        let resultString = L(__calcWorkshopSize_calcFinished, {
            "success": this._completed,
            "total": this._total
        });

        resultString += "<br>";

        resultString += L(__calcWorkshopSize_totalSize, {
            "size": this._getFileSizeStr(this._totalSize)
        });

        waitDialog.dismiss();
        SteamFacade.showAlertDialog(L(__calcWorkshopSize_calcSize), resultString);
        this._addFileSizes(); // Add file sizes now that data has been fetched
    }

    private getStatus(): string[] {
        const status = [];

        status.push(L(__calcWorkshopSize_calcLoading, {
            "i": this._completed,
            "count": this._total
        }));

        if (this._failed > 0) {
            status.push(L(__workshop_failed, {"n": this._failed}));
        }

        return status;
    }

    _getFileSizeStr(size: number): string {
        const units = ["TB", "GB", "MB", "KB"];

        const index = units.findIndex((_unit, i) => size / (1000 ** (units.length - (i + 1))) >= 1);
        return `${(size / (1000 ** (units.length - (index + 1)))).toFixed(2)} ${units[index]}`;
    }

    async _getFileSize(node: HTMLElement, preventFetch = false): Promise<number|null> {
        const id = Number(node.id.replace("Subscription", ""));
        return await SteamCommunityApiFacade.getWorkshopFileSize(id, preventFetch)
    }
}
