import {__members, __name, __theworddefault} from "@Strings/_strings";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import Feature from "@Content/Modules/Context/Feature";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import {L} from "@Core/Localization/Localization";
import SyncedStorage from "@Core/Storage/SyncedStorage";
import type {SortboxChangeEvent} from "@Content/Modules/Widgets/SortboxChangeEvent";

export default class FGroupsSort extends Feature<CFriendsAndGroups> {

    private _container: HTMLElement|null = null;

    apply(): void | Promise<void> {
        document.addEventListener("as_subpageNav", () => this.callback());
        this.callback();
    }

    private async callback() {
        if (!document.getElementById("groups_list")) {
            return;
        }

        this._container = document.querySelector<HTMLElement>("#search_results");
        if (!this._container || this._container.querySelectorAll(".group_block").length <= 1) {
            return;
        }

        const anchor = document.querySelector("span.profile_groups.title");
        if (!anchor) {
            return;
        }

        const sortbox = new SortBox({
            target: anchor.parentElement!,
            anchor: anchor.nextElementSibling ?? undefined, // `null` if not on own profile
            props: {
                name: "groups",
                options: [
                    ["default", L(__theworddefault)],
                    ["members", L(__members)],
                    ["names", L(__name)]
                ],
                value: (await SyncedStorage.get("sortgroupsby")) ?? "default_ASC"
            }
        });
        sortbox.$on("change", (e: CustomEvent<SortboxChangeEvent>) => {
            const {value, key, direction} = e.detail;
            this._sortGroups(key, direction < 0);
            SyncedStorage.set("sortgroupsby", value);
        });
    }

    _sortGroups(sortBy: string, reversed: boolean): void {
        if (!this._container) {
            return;
        }

        const property = `esSort${sortBy}`;
        const rows: [string, HTMLElement][] = [];

        // Query available groups on each sort because they may be removed by our leave group feature, see #1520
        this._container.querySelectorAll<HTMLElement>(".group_block").forEach((node, i) => {

            // Set default position
            if (!node.dataset.esSortdefault) {
                node.dataset.esSortdefault = String(i);
            }

            let value = node.dataset[property];
            if (typeof value === "undefined") {
                if (sortBy === "members") {
                    value = node.querySelector(".memberRow > a")!.textContent!.match(/\d+/g)?.join("");
                } else if (sortBy === "names") {
                    value = node.querySelector(".groupTitle > a")!.textContent ?? undefined;
                }

                if (!value) { return; }
                value = String(value);
                node.dataset[property] = value;
            }

            rows.push([value, node]);
        });

        rows.sort(this._getSortFunc(sortBy));

        if (reversed) {
            rows.reverse();
        }

        rows.forEach(row => this._container!.append(row[1]));
    }

    _getSortFunc(sortBy: string) {
        type Param = [string, HTMLElement];
        switch (sortBy) {
            case "default":
                return (a: Param, b: Param) => Number(a[0]) - Number(b[0]);
            case "members":
                return (a: Param, b: Param) => Number(b[0]) - Number(a[0]);
            case "names":
                return (a: Param, b: Param) => a[0].localeCompare(b[0]);
            default:
                this.logError(
                    new Error("Invalid sorting criteria"),
                    "Can't sort groups by criteria '%s'",
                    sortBy,
                );
                return () => 0;
        }
    }
}
