import {__lastonline, __theworddefault} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import SyncedStorage from "@Core/Storage/SyncedStorage";
import RequestData from "@Content/Modules/Data/RequestData";
import HTML from "@Core/Html/Html";
import {mount} from "svelte";

export default class FFriendsSort extends Feature<CFriendsAndGroups> {

    #friendsFetched: boolean = false;
    #offlineFriends: HTMLElement[] = [];

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.myProfile) {
            return "Not your profile";
        }

        this.context.onSubpageNav.subscribe(() => this.#callback(), true);
        return null;
    }

    async #callback(): Promise<void> {
        if (!document.getElementById("friends_list")) {
            return;
        }

        this.#offlineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));
        if (this.#offlineFriends.length <= 1) {
            return;
        }

        this.#offlineFriends.forEach((friend, i) => {
            friend.dataset.esSortdefault = String(i);
        });

        const anchor = document.querySelector("#manage_friends_control");
        if (!anchor) {
            return;
        }

        mount(SortBox, {
            target: anchor.parentElement!,
            anchor,
            props: {
                name: "friends",
                options: [
                    ["default", L(__theworddefault)],
                    ["lastonline", L(__lastonline)]
                ],
                value: (await SyncedStorage.get("sortfriendsby") ?? "default_ASC"),
                onchange: (value: string, key: string, direction: number) => {
                    this._sortFriends(key, direction < 0);
                    SyncedStorage.set("sortfriendsby", value);
                }
            }
        });
    }

    async _sortFriends(sortBy: string, reversed: boolean): Promise<void> {
        const property = `esSort${sortBy}`;

        if (sortBy === "lastonline" && !this.#friendsFetched) {

            this.#friendsFetched = true;
            const data = await RequestData.getText("https://steamcommunity.com/my/friends/?ajax=1&l=english");
            const dom = HTML.toDom(data);
            const lastOnlineRegex = /Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/;

            for (const friend of dom.querySelectorAll<HTMLElement>(".friend_block_v2.persona.offline")) {

                // Doesn't exist when profile is private
                const lastOnline = friend.querySelector(".friend_last_online_text")?.textContent!.match(lastOnlineRegex);

                let downtime = Infinity;
                if (lastOnline) {
                    const days = Number(lastOnline[1]) || 0;
                    const hours = Number(lastOnline[2]) || 0;
                    const minutes = Number(lastOnline[3]) || 0;
                    downtime = (((days * 24) + hours) * 60) + minutes;
                }
                document.querySelector<HTMLElement>(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`)!
                    .dataset[property] = String(downtime);
            }
        }

        this.#offlineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

        // reverse if otherwise, because nodes are inserted at the "afterend" position
        if (!reversed) {
            this.#offlineFriends.reverse();
        }

        const offlineBlock = document.getElementById("state_offline");
        if (offlineBlock) {
            this.#offlineFriends.forEach(friend => offlineBlock.after(friend));
        }
    }
}
