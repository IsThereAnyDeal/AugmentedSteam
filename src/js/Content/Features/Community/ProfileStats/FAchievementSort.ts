import {HTML, Language, Localization} from "../../../../modulesCore";
import {Feature, RequestData, Sortbox} from "../../../modulesContent";
import type {CProfileStats} from "./CProfileStats";
import {DateTime} from "luxon";

export default class FAchievementSort extends Feature<CProfileStats> {

    private bookmark: Element|null = null;
    private defaultSort: Element[] = [];
    private unlockedMap: Map<Element, number> = new Map();
    private achievementsFetched: boolean = false;

    override checkPrerequisites(): boolean {

        // Check if the user has unlocked more than 1 achievement
        return document.querySelectorAll("#personalAchieve .achieveUnlockTime").length > 1;
    }

    override apply(): void {

        this.defaultSort = Array.from(document.querySelectorAll(".achieveRow"))
            .filter(el => el.querySelector(".achieveUnlockTime") !== null);

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

        if (sortBy === "time" && !this.achievementsFetched) {

            this.achievementsFetched = true;

            const dom = Language.getCurrentSteamLanguage() === "english"
                ? document
                : await this._fetchAchievementsPage();

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

                this.unlockedMap.set(this.defaultSort[i], unlockedTime.toUnixInteger());
            }
        }

        let sortedNodes: Element[] = [];

        if (sortBy === "default") {
            sortedNodes = [...this.defaultSort];
        } else if (sortBy === "time") {
            sortedNodes = [...this.unlockedMap.keys()]
                .sort((a, b) => (this.unlockedMap.get(a) ?? 0) - (this.unlockedMap.get(b) ?? 0));
        }

        if (reversed) {
            sortedNodes.reverse();
        }

        sortedNodes.forEach(node => this.bookmark.before(node));
    }

    private async _fetchAchievementsPage(): Promise<DocumentFragment> {
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set("l", "english");

        const data = await RequestData.getHttp(url.toString());
        return HTML.toDom(data);
    }
}
