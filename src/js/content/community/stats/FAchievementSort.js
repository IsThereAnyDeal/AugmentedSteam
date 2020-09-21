import {Feature} from "modules";

import {Localization} from "core";
import {RequestData, Sortbox} from "common";

export default class FAchievementSort extends Feature {

    checkPrerequisites() {
        return (this._personal = document.getElementById("personalAchieve")) !== null;
    }

    apply() {

        this._nodes = {
            "default": [],
            "time": [],
        };

        document.getElementById("tabs").insertAdjacentElement("beforebegin", Sortbox.get(
            "achievements",
            [
                ["default", Localization.str.theworddefault],
                ["time", Localization.str.date_unlocked],
            ],
            "default",
            (key, reversed) => { this._sortBy(key, reversed); },
        ));

        this._addSortMetaData("default", this._personal.querySelectorAll("#personalAchieve .achieveRow"));
    }

    async _sortBy(key, reversed) {

        if (key === "time") {
            if (!this._nodes.time.length) {
                await this._addSortMetaData(key, this._personal.querySelectorAll(".achieveRow"));
            }
        }
        
        for (let br of this._personal.querySelectorAll(":scope > br")) br.remove();
        for (let [, node] of this._nodes[key]) {
            this._personal.insertAdjacentElement(reversed ? "afterbegin" : "beforeend", node);
        }
    }

    async _addSortMetaData(key, achievements) {

        if (key === "default") {

            achievements.forEach((row, i) => this._nodes.default.push([i, row]));
            return;

        } else if (key === "time") {

            let url = new URL(window.location.href);
            url.searchParams.append("xml", 1);

            const result = await RequestData.getHttp(url.toString());
            let xmlDoc = new DOMParser().parseFromString(result, "text/xml");
            let xmlTags = xmlDoc.getElementsByTagName("achievement");

            for (let i = 0; i < this._nodes.default.length; ++i) {
                let node = this._nodes.default[i][1];
                let unlockTime = 0;
                let unlockTimestamp = xmlTags[i].querySelector("unlockTimestamp");
                if (unlockTimestamp) {
                    unlockTime = unlockTimestamp.textContent;
                }
                this._nodes.time.push([unlockTime, node]);

                node.classList.add(unlockTime === 0 ? "esi_ach_locked" : "esi_ach_unlocked");
            }

            this._nodes.time.sort((a, b) => {
                return b[0] - a[0]; // descending sort
            });
        }
    }
}
