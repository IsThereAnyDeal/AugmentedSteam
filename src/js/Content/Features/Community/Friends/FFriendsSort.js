import {HTMLParser, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, RequestData, Sortbox} from "../../../modulesContent";

export default class FFriendsSort extends Feature {

    checkPrerequisites() {
        // Only add sort options if on own friends page
        if (!document.querySelector("#manage_friends_control")) { return false; }

        this.offlineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));
        return this.offlineFriends.length > 1;
    }

    apply() {

        this.offlineFriends.forEach((friend, i) => { friend.dataset.esSortDefault = i; });

        document.querySelector("#manage_friends_control").insertAdjacentElement("beforebegin", Sortbox.get(
            "friends",
            [
                ["default", Localization.str.theworddefault],
                ["lastonline", Localization.str.lastonline]
            ],
            SyncedStorage.get("sortfriendsby"),
            (sortBy, reversed) => { this._sortFriends(sortBy, reversed); },
            "sortfriendsby"
        ));
    }

    async _sortFriends(sortBy, reversed) {

        const _sortBy = (sortBy === "lastonline" ? "lastonline" : "default");

        if (_sortBy === "lastonline" && !this._friendsFetched) {

            this._friendsFetched = true;
            const data = await RequestData.getHttp("https://steamcommunity.com/my/friends/?ajax=1&l=english");
            const dom = HTMLParser.htmlToElement(data);

            for (const friend of dom.querySelectorAll(".friend_block_v2.persona.offline")) {
                let lastOnline = friend.querySelector(".friend_last_online_text");

                // Doesn't exist when profile is private
                if (lastOnline) {
                    lastOnline = lastOnline.textContent.match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/);
                }

                let downtime = Infinity;
                if (lastOnline) {
                    const days = parseInt(lastOnline[1]) || 0;
                    const hours = parseInt(lastOnline[2]) || 0;
                    const minutes = parseInt(lastOnline[3]) || 0;
                    downtime = (((days * 24) + hours) * 60) + minutes;
                }
                document.querySelector(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`).dataset.esSortTime = downtime;
            }
        }

        const property = `esSort${_sortBy === "default" ? "Default" : "Time"}`;
        this.offlineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

        const offlineBlock = document.querySelector("#state_offline");
        for (const friend of this.offlineFriends) {
            if (reversed) {
                offlineBlock.insertAdjacentElement("afterend", friend);
            } else {
                offlineBlock.parentElement.appendChild(friend);
            }
        }
    }
}
