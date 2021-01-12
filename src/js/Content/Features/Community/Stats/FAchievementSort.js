import {Localization} from "../../../../modulesCore";
import {Feature, RequestData, Sortbox} from "../../../modulesContent";

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
            "default_ASC",
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

        for (const br of this._personal.querySelectorAll(":scope > br")) { br.remove(); }
        for (const [, node] of this._nodes[key]) {
            this._personal.insertAdjacentElement(reversed ? "afterbegin" : "beforeend", node);
        }
    }

    async _addSortMetaData(key, achievements) {

        if (key === "default") {

            achievements.forEach((row, i) => this._nodes.default.push([i, row]));


        } else if (key === "time") {

            const url = new URL(window.location.href);
            url.searchParams.append("xml", 1);

            const result = await RequestData.getHttp(url.toString());
            const xmlDoc = new DOMParser().parseFromString(result, "text/xml");
            const xmlTags = xmlDoc.getElementsByTagName("achievement");

            for (let i = 0; i < this._nodes.default.length; ++i) {
                const node = this._nodes.default[i][1];
                let unlockTime = 0;
                const unlockTimestamp = xmlTags[i].querySelector("unlockTimestamp");
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
