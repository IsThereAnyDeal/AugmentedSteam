import {Feature} from "modules";

import {HTML, Localization} from "core";
import {Background, ExtensionLayer, RequestData} from "common";

export class FWorkshopFileSizes extends Feature {

    async apply() {
        this._addFileSizes();
        this._addTotalSizeButton();
    }

    async _addFileSizes() {
        for (let node of document.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("sized")) { continue; }
            
            let id = node.id.replace("Subscription", "");
            let size = await Background.action("workshopfilesize", id, true);
            if (typeof size !== "number") { continue; }

            let str = Localization.str.calc_workshop_size.file_size.replace("__size__", this._getFileSizeStr(size));
            HTML.beforeEnd(node.querySelector(".workshopItemSubscriptionDetails"), `<div class="workshopItemDate">${str}</div>`)
            node.classList.add("sized");
        }
    }

    _addTotalSizeButton() {

        let panel = document.querySelector(".primary_panel");
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
        
        document.getElementById("es_calc_size").addEventListener("click", async () => {

            ExtensionLayer.runInPageContext((calculating, totalSize) => {
                ShowBlockingWaitDialog(calculating, totalSize);
            },
            [
                Localization.str.calc_workshop_size.calculating,
                Localization.str.calc_workshop_size.total_size.replace("__size__", "0 KB"),
            ]);

            let totalStr = document.querySelector(".workshopBrowsePagingInfo").innerText.match(/\d+[,\d]*/g).pop();
            let total = Number(totalStr.replace(/,/g, ""));
            let parser = new DOMParser();
            let totalSize = 0;
            let url = new URL(window.location.href);

            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let doc = parser.parseFromString(result, "text/html");
                for (let item of doc.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
                    let id = item.id.replace("Subscription", "");
                    let size;

                    try {
                        size = await Background.action("workshopfilesize", id);
                    } catch(err) {
                        console.group("Workshop file sizes");
                        console.error(`Couldn't get file size for item ID ${id}`);
                        console.error(err);
                        console.groupEnd();
                    }
    
                    if (!size) { continue; }

                    totalSize += size;
                    
                    ExtensionLayer.runInPageContext((calculating, totalSize) => {
                        CModal.DismissActiveModal();
                        ShowBlockingWaitDialog(calculating, totalSize);
                    },
                    [
                        Localization.str.calc_workshop_size.calculating,
                        Localization.str.calc_workshop_size.total_size.replace("__size__", this._getFileSizeStr(totalSize)),
                    ]);
                }
            }

            this._addFileSizes();

            ExtensionLayer.runInPageContext((finished, totalSize) => {
                CModal.DismissActiveModal();
                ShowAlertDialog(finished, totalSize);
            },
            [
                Localization.str.calc_workshop_size.finished,
                Localization.str.calc_workshop_size.total_size.replace("__size__", this._getFileSizeStr(totalSize)),
            ]);
        });
    }

    _getFileSizeStr(size) {
        let units = ["TB", "GB", "MB", "KB"];

        let index = units.findIndex((unit, i) =>
            size / Math.pow(1000, units.length - (i + 1)) >= 1
        );
        return `${(size / Math.pow(1000, units.length - (index + 1))).toFixed(2)} ${units[index]}`;
    }
}
