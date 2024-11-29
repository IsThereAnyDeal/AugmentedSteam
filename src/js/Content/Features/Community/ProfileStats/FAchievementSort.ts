import {DateTime, type DateTimeOptions} from "luxon";
import {__dateUnlocked, __theworddefault} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Language from "@Core/Localization/Language";
import HTML from "@Core/Html/Html";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileStats from "@Content/Features/Community/ProfileStats/CProfileStats";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import RequestData from "@Content/Modules/RequestData";

interface DateFormatSettings {
    format: string,
    formatShort: string,
    options: DateTimeOptions
}

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

        const tabs = document.getElementById("tabs");
        if (tabs === null) {
            throw new Error("Did not find #tabs");
        }

        (new SortBox({
            target: tabs.parentElement!,
            anchor: tabs,
            props: {
                name: "achievements",
                options: [
                    ["default", L(__theworddefault)],
                    ["time", L(__dateUnlocked)],
                ],
                value: "default_ASC"
            }
        })).$on("change", e => {
            const {key, direction} = e.detail;
            this._sortRows(key, direction < 0);
        })
    }

    private getDateFormat(language: string): DateFormatSettings|null {

        switch (language) {
            case "english":
                // English format is unstable (different based on region)
                return null;

            case "czech":
                return {
                    format: "'Odemčeno' d. LLL. yyyy v H.mm",
                    formatShort: "'Odemčeno' d. LLL. v H.mm",
                    options: {locale: "cs"}
                };

            // TODO add support for more locales without need to fallback
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

        let dateSetup = this.getDateFormat(this.context.language?.name ?? "");

        const nodes = this.container!.querySelectorAll(".achieveUnlockTime");
        for (const node of nodes) {
            if (!node.firstChild?.textContent) { continue; }

            const achieveRow = node.closest(".achieveRow");
            if (!achieveRow) { continue; }

            this.defaultSort.push(achieveRow);

            if (dateSetup) {
                const dateString = node.firstChild.textContent.trim();

                const {format, formatShort, options} = dateSetup;
                const fmt = /\d{4}/.test(dateString) ? format : formatShort;
                const unlockedTime = DateTime.fromFormat(dateString, fmt, options).toUnixInteger();

                if (Number.isNaN(unlockedTime)) {
                    this.logError(
                        new Error("Invalid unlocked time"),
                        `Failed to parse "${dateString}" with format "${fmt}"`
                    );
                    return;
                }

                this.unlockedMap.set(achieveRow, unlockedTime);
            }
        }

        // fallback, load the same page in czech
        if (dateSetup === null) {
            dateSetup = this.getDateFormat("czech")!;

            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set("l", "czech");

            const data = await RequestData.getText(url.toString());
            const nodes = HTML.toDom(data).querySelectorAll(".achieveUnlockTime");
            if (nodes.length !== this.defaultSort.length) {
                throw new Error("Achievement nodes mismatch");
            }

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!node || !node.firstChild?.textContent) { continue; }

                const achieveRow = node.closest(".achieveRow");
                if (!achieveRow) { continue; }

                const dateString = node.firstChild.textContent.trim();

                const {format, formatShort, options} = dateSetup;
                const fmt = /\d{4}/.test(dateString) ? format : formatShort;
                const unlockedTime = DateTime.fromFormat(dateString, fmt, options).toUnixInteger();

                if (Number.isNaN(unlockedTime)) {
                    this.logError(
                        new Error("Invalid unlocked time"),
                        `Failed to parse "${dateString}" with format "${fmt}"`
                    );
                    return;
                }

                this.unlockedMap.set(this.defaultSort[i]!, unlockedTime);
            }
        }
    }

    private async _sortRows(sortBy: string, reversed: boolean) {
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
