import {Localization} from "../../../../modulesCore";
import {Feature, Sortbox} from "../../../modulesContent";

export default class FAchievementSort extends Feature {

    checkPrerequisites() {
        // Check if the user has unlocked more than 1 achievement
        return document.querySelectorAll("#personalAchieve .achieveUnlockTime").length > 1;
    }

    apply() {

        this._achievementsFetched = false;

        this._container = document.getElementById("personalAchieve");
        this._isCompareView = this._container.classList.contains("compare_view");
        this._nodes = [];

        document.getElementById("tabs").insertAdjacentElement("beforebegin", Sortbox.get(
            "achievements",
            [
                ["default", Localization.str.theworddefault],
                ["time", Localization.str.date_unlocked],
            ],
            "default_ASC",
            (sortBy, reversed) => { this._sortRows(sortBy, reversed); },
        ));
    }

    async _sortRows(sortBy, reversed) {

        const container = this._container;

        if (!this._achievementsFetched) {
            this._achievementsFetched = true;

            let achievements = await this.context.getAchievementData();
            achievements = Object.values({...achievements.open, ...achievements.closed});

            const nodes = container.querySelectorAll(".achieveRow");
            for (let i = 0; i < nodes.length; ++i) {
                const node = nodes[i];
                const name = node.querySelector(".achieveTxt > h3").textContent;
                const unlockTime = achievements.find(val => val.name === name)?.unlock_time ?? 0;

                if (unlockTime === 0) {
                    node.classList.add("esi_ach_locked");
                } else {
                    node.classList.add("esi_ach_unlocked");
                    this._nodes.push({"default": i, "time": unlockTime, node}); // Only reorder unlocked achievements
                }
            }

            /*
             * Remove linebreaks and transparent img (the latter is visible in compare views).
             * Replace with CSS margins to maintain spacing.
             */
            for (const el of container.querySelectorAll(":scope > br, :scope > img")) {
                el.remove();
            }

            // Wrap avatars in a container (visible in compare views)
            if (this._isCompareView) {
                this._avatars = document.createElement("div");
                this._avatars.classList.add("esi_ach_avatars");
                this._avatars.append(...container.querySelectorAll(".topAvatarsLeft, .topAvatarsRight"));
                container.prepend(this._avatars);
            }
        }

        this._nodes.sort((a, b) => a[sortBy] - b[sortBy]);

        // reverse if otherwise, because nodes are inserted at the "afterbegin" position
        if (!reversed) {
            this._nodes.reverse();
        }

        this._nodes.forEach(({node}) => container.prepend(node));

        // Restore avatars to its original position
        if (this._isCompareView) {
            container.prepend(this._avatars);
        }
    }
}
