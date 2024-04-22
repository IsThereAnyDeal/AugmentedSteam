import {HTML, Language, Localization} from "../../../../modulesCore";
import {Feature, RequestData, Sortbox} from "../../../modulesContent";
import type {CProfileStats} from "./CProfileStats";
import {DateTime, type DateTimeOptions} from "luxon";

export default class FAchievementSort extends Feature<CProfileStats> {

    private container: Element|null = null;
    private bookmark: Element|null = null;

    private defaultSort: Element[] = [];
    private unlockedMap: Map<Element, number> = new Map();

    override checkPrerequisites(): boolean {

        // Check if the user has unlocked more than 1 achievement
        return document.querySelectorAll("#personalAchieve .achieveUnlockTime").length > 1;
    }

    override async apply(): Promise<void> {

        this.container = document.getElementById("personalAchieve");
        if (this.container === null) {
            throw new Error("Did not find #personalAchieve node");
        }

        const sortbox = Sortbox.get(
            "achievements",
            [
                ["default", Localization.str.theworddefault],
                ["time", Localization.str.date_unlocked],
            ],
            "default_ASC",
            (sortBy: "time"|"default", reversed: boolean) => { this._sortRows(sortBy, reversed); },
        );
        if (sortbox === null) {
            throw new Error("Failed to create Sortbox");
        }

        const tabs = document.getElementById("tabs");
        if (tabs === null) {
            throw new Error("Did not find #tabs");
        }
        tabs.insertAdjacentElement("beforebegin", sortbox);
    }

    private getDateFormat(language: string): {format: string, options?: DateTimeOptions}|null {

        switch (language) {
            case "english":
                return {
                    format: "'Unlocked' d LLL, yyyy '@' h:mma",
                    formatNoYear: "'Unlocked' d LLL '@' h:mma",
                };

            case "czech":
                return {
                    format: "'Odemčeno' d. LLL. yyyy v H.mm",
                    formatNoYear: "'Odemčeno' d. LLL. v H.mm",
                    options: {locale: "cs"}
                };

            // TODO add support for more locales without need to fallback to english
        }

        return null;
    }

    private async onFirstSort() {

        const achieveRow = document.querySelector(".achieveRow");
        if (!achieveRow) {
            throw new Error("Could not create bookmark");
        }

        this.bookmark = document.createElement("div");
        achieveRow.insertAdjacentElement("beforebegin", this.bookmark);

        let dateSetup = this.getDateFormat(Language.getCurrentSteamLanguage() ?? "");
        console.log(dateSetup);

        let check = true;

        const nodes = this.container!.querySelectorAll(".achieveUnlockTime");
        for (const node of nodes) {
            if (!node.firstChild?.textContent) {
                console.log("textContent missing");
                continue;
            }

            const achieveRow = node.closest(".achieveRow");
            if (!achieveRow) {
                console.log("achieveRow missing");
                continue;
            }

            this.defaultSort.push(achieveRow);

            if (dateSetup) {
                const dateString = node.firstChild.textContent.trim();
                const {format, formatNoYear, options} = dateSetup;

                if (check) {
                    check = false;
                    const unlockedTime = DateTime.fromFormatExplain(
                        dateString,
                        /\d{4}/.test(dateString) ? format : formatNoYear,
                        options
                    );
                    console.log(unlockedTime);
                }

                const unlockedTime = DateTime.fromFormat(
                    dateString,
                    /\d{4}/.test(dateString) ? format : formatNoYear,
                    options
                );
                this.unlockedMap.set(achieveRow, unlockedTime.toUnixInteger());
            }
        }

        // fallback, load the same page in english
        if (dateSetup === null) {
            dateSetup = this.getDateFormat("english");

            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set("l", "english");

            const data = await RequestData.getHttp(url.toString());
            const nodes = HTML.toDom(data).querySelectorAll(".achieveUnlockTime");
            if (nodes.length !== this.defaultSort.length) {
                throw new Error("Achievement nodes mismatch");
            }

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!node.firstChild?.textContent) { continue; }

                const achieveRow = node.closest(".achieveRow");
                if (!achieveRow) { continue; }

                const dateString = node.firstChild.textContent.trim();
                const {format, formatNoYear} = <{format: string}>dateSetup;
                const unlockedTime = DateTime.fromFormat(
                    dateString,
                    /\d{4}/.test(dateString) ? format : formatNoYear
                );

                this.unlockedMap.set(this.defaultSort[i], unlockedTime.toUnixInteger());
            }
        }
    }

    private async _sortRows(sortBy: "time"|"default", reversed: boolean) {
        if (!this.bookmark) {
            await this.onFirstSort();
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

        for (let node of sortedNodes) {
            this.bookmark!.insertAdjacentElement("beforebegin", node);
        }
    }
}
