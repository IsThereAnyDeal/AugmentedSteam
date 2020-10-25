import {Feature} from "modules";

import {HTMLParser, Localization, SyncedStorage} from "../../../core_modules";
import {RequestData, Sortbox} from "common";

export default class FFriendsSort extends Feature {

    checkPrerequisites() {
        return document.querySelectorAll(".friend_block_v2.persona.offline").length !== 0
            && document.querySelector("#manage_friends_control") !== null;
    }

    apply() {

        const offlineFriends = document.querySelectorAll(".friend_block_v2.persona.offline");

        offlineFriends.forEach((friend, i) => { friend.dataset.esSortDefault = i; });

        const sortBy = SyncedStorage.get("sortfriendsby");

        document.querySelector("#manage_friends_control").insertAdjacentElement("beforebegin", Sortbox.get(
            "friends",
            [["default", Localization.str.theworddefault], ["lastonline", Localization.str.lastonline]],
            sortBy,
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
                const lastOnline = friend.querySelector(".friend_last_online_text").textContent.match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/);
                let time = Infinity;
                if (lastOnline) {
                    const days = parseInt(lastOnline[1]) || 0;
                    const hours = parseInt(lastOnline[2]) || 0;
                    const minutes = parseInt(lastOnline[3]) || 0;
                    const downtime = (((days * 24) + hours) * 60) + minutes;
                    time = downtime;
                }
                document.querySelector(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`).dataset.esSortTime = time;
            }
        }

        const offlineBlock = document.querySelector("#state_offline");
        const curOfflineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));

        const property = `esSort${_sortBy === "default" ? "Default" : "Time"}`;
        curOfflineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

        for (const friend of curOfflineFriends) {
            if (reversed) {
                offlineBlock.insertAdjacentElement("afterend", friend);
            } else {
                offlineBlock.parentElement.appendChild(friend);
            }
        }
    }
}
