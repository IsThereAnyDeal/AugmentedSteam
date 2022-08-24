import {HTMLParser, Localization} from "../../../../modulesCore";
import {Feature, RequestData, Sortbox} from "../../../modulesContent";

export default class FAchievementSort extends Feature {

    checkPrerequisites() {
        // Check if the user has at least 2 achievements unlocked
        return document.querySelectorAll("#personalAchieve .achieveUnlockTime").length > 1;
    }

    apply() {

        this._container = document.getElementById("personalAchieve");
        this._isCompareView = this._container.classList.contains("compare_view");
        this._nodes = {
            "default": Array.from(this._container.querySelectorAll(".achieveRow")),
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
    }

    async _sortBy(key, reversed) {

        const container = this._container;

        if (!this._initSort) {

            /*
             * Remove linebreaks and transparent img (the latter is visible in compare views).
             * Replace with CSS margins to maintain spacing.
             */
            for (const el of container.querySelectorAll(":scope > br, :scope > img")) {
                el.remove();
            }

            // Wrap avatars in a container
            if (this._isCompareView) {
                this._avatars = document.createElement("div");
                this._avatars.classList.add("esi_ach_avatars");
                this._avatars.append(...container.querySelectorAll(".topAvatarsLeft, .topAvatarsRight"));
                container.insertAdjacentElement("afterbegin", this._avatars);
            }

            this._initSort = true;
        }

        if (key === "time") {

            if (this._nodes.time.length === 0) {
                try {
                    await this._initSortByTime();
                } catch (err) {
                    console.error(err);
                    return;
                }
            }

            if (reversed) {
                // Descending sort, because nodes are inserted at the "afterbegin" position
                this._nodes.time.sort((a, b) => b[0] - a[0]);
            } else {
                this._nodes.time.sort((a, b) => a[0] - b[0]);
            }

            for (const [, node] of this._nodes.time) {
                container.insertAdjacentElement("afterbegin", node);
            }
        } else if (key === "default") {

            for (const node of this._nodes.default) {
                container.insertAdjacentElement(reversed ? "afterbegin" : "beforeend", node);
            }
        }

        // Restore avatars to its original position
        if (this._isCompareView) {
            container.insertAdjacentElement("afterbegin", this._avatars);
        }
    }

    async _initSortByTime() {

        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set("tab", "achievements");
        url.searchParams.set("panorama", "please");

        const result = await RequestData.getHttp(url.toString());
        let achievements = HTMLParser.getVariableFromText(result, "g_rgAchievements", "object");
        achievements = Object.values({...achievements.open, ...achievements.closed});

        for (const node of this._nodes.default) {
            const name = node.querySelector(".achieveTxt > h3").textContent;
            const unlockTime = achievements.find(val => val.name === name)?.unlock_time ?? 0;

            if (unlockTime === 0) {
                node.classList.add("esi_ach_locked");
            } else {
                node.classList.add("esi_ach_unlocked");
                this._nodes.time.push([unlockTime, node]); // Only reorder unlocked achievements
            }
        }
    }
}
