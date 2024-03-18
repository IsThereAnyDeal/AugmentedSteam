import {HTML, Localization} from "../../../../modulesCore";
import {Feature, RequestData, Sortbox} from "../../../modulesContent";
import type {CProfileStats} from "./CProfileStats";
import {DateTime} from "luxon";

export default class FAchievementSort extends Feature<CProfileStats> {

    private bookmark: Element|null = null;
    private unlockedAchievements: Element[] = [];
    private achievementsFetched: boolean = false;

    override checkPrerequisites(): boolean {

        // Check if the user has unlocked more than 1 achievement
        return document.querySelectorAll("#personalAchieve .achieveUnlockTime").length > 1;
    }

    override apply(): void {

        this.unlockedAchievements = Array.from(document.querySelectorAll(".achieveRow"))
            .filter(el => !!el.querySelector(".achieveUnlockTime"));

        this.unlockedAchievements.forEach((ach, i) => { ach.dataset.esSortdefault = `${i}`; });

        // Insert an empty div before the first unlocked achievement as an anchor for sorted nodes
        this.bookmark = document.createElement("div");
        document.querySelector(".achieveRow")!.before(this.bookmark);

        document.getElementById("tabs")!.before(Sortbox.get(
            "achievements",
            [
                ["default", Localization.str.theworddefault],
                ["time", Localization.str.date_unlocked],
            ],
            "default_ASC",
            (sortBy: "default"|"time", reversed: boolean) => { this._sortRows(sortBy, reversed); },
        ));
    }

    private async _sortRows(sortBy: "default"|"time", reversed: boolean) {

        const property = `esSort${sortBy}`;

        if (sortBy === "time" && !this.achievementsFetched) {

            this.achievementsFetched = true;

            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set("l", "english");

            const data = await RequestData.getHttp(url.toString());
            const dom = HTML.toDom(data);
            const nodes = dom.querySelectorAll(".achieveRow");

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const unlockedText = node.querySelector(".achieveUnlockTime")?.firstChild?.textContent?.trim();
                if (!unlockedText) { continue; }

                const unlockedTime = DateTime.fromFormat(
                    unlockedText,
                    "'Unlocked' d LLL, yyyy '@' h:mma",
                    {"locale": "en-US"}
                );

                document.querySelector(`.achieveRow[data-es-sortdefault="${i}"]`)!
                    .dataset[property] = `${unlockedTime.toUnixInteger()}`;
            }
        }

        this.unlockedAchievements.sort(this._getSortFunc(sortBy, property));

        if (reversed) {
            this.unlockedAchievements.reverse();
        }

        this.unlockedAchievements.forEach(ach => this.bookmark.before(ach));
    }

    private _getSortFunc(sortBy: "default"|"time", property) {
        switch (sortBy) {
            case "default":
                return (a, b) => Number(a.dataset[property] ?? 0) - Number(b.dataset[property] ?? 0);
            case "time":
                return (a, b) => Number(b.dataset[property] ?? 0) - Number(a.dataset[property] ?? 0);
            default:
                this.logError(
                    new Error("Invalid sorting criteria"),
                    "Can't sort achievements by criteria '%s'",
                    sortBy,
                );
                return () => 0;
        }
    }
}
