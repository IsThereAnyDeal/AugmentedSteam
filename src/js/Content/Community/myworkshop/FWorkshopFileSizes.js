import {HTML, Localization} from "../../../core_modules";
import {Background, Feature, RequestData} from "../../../Modules/content";
import {Page} from "../../Page";

export default class FWorkshopFileSizes extends Feature {

    apply() {
        this._addFileSizes();
        this._addTotalSizeButton();
    }

    async _addFileSizes() {
        for (const node of document.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("sized")) { continue; }

            const id = node.id.replace("Subscription", "");
            const size = await Background.action("workshopfilesize", id, true);
            if (typeof size !== "number") { continue; }

            const str = Localization.str.calc_workshop_size.file_size.replace("__size__", this._getFileSizeStr(size));
            HTML.beforeEnd(node.querySelector(".workshopItemSubscriptionDetails"), `<div class="workshopItemDate">${str}</div>`);
            node.classList.add("sized");
        }
    }

    _addTotalSizeButton() {

        const panel = document.querySelector(".primary_panel");
        HTML.beforeEnd(panel,
            `<div class="menu_panel">
                <div class="rightSectionHolder">
                    <div class="rightDetailsBlock">
                        <span class="btn_grey_steamui btn_medium" id="es_calc_size">
                            <span>${Localization.str.calc_workshop_size.calc_size}</span>
                        </span>
                    </div>
                </div>
            </div>`);

        document.getElementById("es_calc_size").addEventListener("click", async() => {

            Page.runInPageContext((calculating, totalSize) => {
                ShowBlockingWaitDialog(calculating, totalSize); // eslint-disable-line no-undef, new-cap
            },
            [
                Localization.str.calc_workshop_size.calculating,
                Localization.str.calc_workshop_size.total_size.replace("__size__", "0 KB"),
            ]);

            const totalStr = document.querySelector(".workshopBrowsePagingInfo").innerText.match(/\d+[,\d]*/g).pop();
            const total = Number(totalStr.replace(/,/g, ""));
            const parser = new DOMParser();
            let totalSize = 0;
            const url = new URL(window.location.href);

            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                const result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error(`Failed to request ${url.toString()}`);
                    continue;
                }

                const doc = parser.parseFromString(result, "text/html");
                for (const item of doc.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
                    const id = item.id.replace("Subscription", "");
                    let size;

                    try {
                        size = await Background.action("workshopfilesize", id);
                    } catch (err) {
                        console.group("Workshop file sizes");
                        console.error(`Couldn't get file size for item ID ${id}`);
                        console.error(err);
                        console.groupEnd();
                    }

                    if (!size) { continue; }

                    totalSize += size;

                    // eslint-disable-next-line no-loop-func -- Page context
                    Page.runInPageContext((calculating, totalSize) => {
                        /* eslint-disable no-undef, new-cap */
                        CModal.DismissActiveModal();
                        ShowBlockingWaitDialog(calculating, totalSize);
                        /* eslint-enable no-undef, new-cap */
                    },
                    [
                        Localization.str.calc_workshop_size.calculating,
                        Localization.str.calc_workshop_size.total_size.replace("__size__", this._getFileSizeStr(totalSize)),
                    ]);
                }
            }

            this._addFileSizes();

            Page.runInPageContext((finished, totalSize) => {
                /* eslint-disable no-undef, new-cap */
                CModal.DismissActiveModal();
                ShowAlertDialog(finished, totalSize);
                /* eslint-enable no-undef, new-cap */
            },
            [
                Localization.str.calc_workshop_size.finished,
                Localization.str.calc_workshop_size.total_size.replace("__size__", this._getFileSizeStr(totalSize)),
            ]);
        });
    }

    _getFileSizeStr(size) {
        const units = ["TB", "GB", "MB", "KB"];

        const index = units.findIndex((unit, i) => size / (1000 ** (units.length - (i + 1))) >= 1);
        return `${(size / (1000 ** (units.length - (index + 1)))).toFixed(2)} ${units[index]}`;
    }
}
