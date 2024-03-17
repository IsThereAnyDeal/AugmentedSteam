import {Localization} from "../../../../modulesCore";
import {Feature, Sortbox} from "../../../modulesContent";
import type {CProfileStats} from "./CProfileStats";
import {DateTime, type DateTimeOptions} from "luxon";
import {Page} from "../../Page";

export default class FAchievementSort extends Feature<CProfileStats> {

    private container: Element|null = null;
    private bookmark: Element|null = null;

    private defaultSort: Element[] = [];
    private unlockedMap: Map<Element, number> = new Map();

    private dateFormat: string|null = null;
    private dateOptions: DateTimeOptions|undefined = undefined;

    override async checkPrerequisites(): Promise<boolean> {

        await this.loadDateFormat();

        // Check if we support current locale
        if (!this.dateFormat) {
            return false;
        }

        // Check if the user has unlocked more than 1 achievement
        return document.querySelectorAll("#personalAchieve .achieveUnlockTime").length > 1;
    }

    override async apply(): Promise<void> {
        if (!this.dateFormat) {
            return;
        }

        this.container = document.getElementById("personalAchieve");
        if (this.container === null) {
            throw new Error("Did not find #personalAchieve node");
        }

        const tabs = document.getElementById("tabs");
        if (tabs === null) {
            throw new Error("Did not find #tabs");
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

        tabs.insertAdjacentElement("beforebegin", sortbox);

        this.bookmark = document.createElement("div");
        const achieveRow = document.querySelector(".achieveRow");
        if (!achieveRow) {
            throw new Error("Could not create bookmark");
        }
        achieveRow.insertAdjacentElement("beforebegin", this.bookmark);

        const nodes = this.container.querySelectorAll(".achieveUnlockTime");
        for (let node of nodes) {
            if (!node.firstChild?.textContent) { continue; }
            const achieveRow = node.closest(".achieveRow");

            if (!achieveRow) { continue; }
            const unlockedTime = DateTime.fromFormat(
                node.firstChild.textContent.trim(),
                this.dateFormat,
                this.dateOptions
            );

            this.defaultSort.push(achieveRow);
            this.unlockedMap.set(achieveRow, unlockedTime.toUnixInteger());
        }
    }

    private async loadDateFormat(): Promise<void> {
        let language = await Page.runInPageContext(() => window.g_strLanguage, [], true);

        switch(language) {
            case "english":
                this.dateFormat = "'Unlocked' d LLL, yyyy '@' h:mma";
                return;

            case "czech":
                this.dateFormat = "'Odemčeno' d. LLL. yyyy v H.mm";
                this.dateOptions = {locale: "cs"};
                return;

            // TODO add support for more locales
        }
    }

    private async _sortRows(sortBy: "time"|"default", reversed: boolean) {
        if (!this.container || !this.bookmark) {
            return;
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
            this.bookmark.insertAdjacentElement("beforebegin", node);
        }
    }
}
