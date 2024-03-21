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

        switch(language) {
            case "english":
                return {
                    format: "'Unlocked' d LLL, yyyy '@' h:mma"
                };

            case "czech":
                return {
                    format: "'Odemčeno' d. LLL. yyyy v H.mm",
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

        const nodes = (<Element>this.container).querySelectorAll(".achieveUnlockTime");
        for (let node of nodes) {
            if (!node.firstChild?.textContent) { continue; }

            const achieveRow = node.closest(".achieveRow");
            if (!achieveRow) { continue; }

            this.defaultSort.push(achieveRow);

            if (dateSetup) {
                let {format, options} = dateSetup;
                const unlockedTime = DateTime.fromFormat(
                    node.firstChild.textContent.trim(),
                    format,
                    options
                );
                this.unlockedMap.set(achieveRow, unlockedTime.toUnixInteger());
            }
        }

        // fallback, load the same page in english
        if (dateSetup === null) {
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set("l", "english");

            let dateSetup = this.getDateFormat("english");
            const data = await RequestData.getHttp(url.toString());
            const nodes = HTML.toDom(data).querySelectorAll(".achieveUnlockTime");
            let i = 0;
            for (let node of nodes) {
                if (!node.firstChild?.textContent) { continue; }

                const achieveRow = node.closest(".achieveRow");
                if (!achieveRow) { continue; }

                let {format} = <{format: string}>dateSetup;
                const unlockedTime = DateTime.fromFormat(
                    node.firstChild.textContent.trim(),
                    format
                );

                let defaultSortNode = this.defaultSort[i++];
                if (!defaultSortNode) {
                    throw new Error("Achievement nodes mismatch");
                }
                this.unlockedMap.set(defaultSortNode, unlockedTime.toUnixInteger());
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
