import {ASFeature} from "modules/ASFeature";

import {HTMLParser, Localization, SyncedStorage} from "core";
import {RequestData, Sortbox} from "common";

export class FFriendsSort extends ASFeature {

    checkPrerequisites() {
        return document.querySelectorAll(".friend_block_v2.persona.offline").length !== 0 && document.querySelector("#manage_friends_control") !== null;
    }

    apply() {

        let offlineFriends = document.querySelectorAll(".friend_block_v2.persona.offline");

        offlineFriends.forEach((friend, i) => friend.dataset.esSortDefault = i);        

        let sortBy = SyncedStorage.get("sortfriendsby");

        document.querySelector("#manage_friends_control").insertAdjacentElement("beforebegin", Sortbox.get(
            "friends",
            [["default", Localization.str.theworddefault], ["lastonline", Localization.str.lastonline]],
            sortBy,
            (sortBy, reversed) => { this._sortFriends(sortBy, reversed); },
            "sortfriendsby")
        );
    }

    async _sortFriends(sortBy, reversed) {

        sortBy = (sortBy === "lastonline" ? "lastonline" : "default");

        if (sortBy === "lastonline" && !this._friendsFetched) {
            
            this._friendsFetched = true;
            let data = await RequestData.getHttp("https://steamcommunity.com/my/friends/?ajax=1&l=english");
            let dom = HTMLParser.htmlToElement(data);

            for (let friend of dom.querySelectorAll(".friend_block_v2.persona.offline")) {
                let lastOnline = friend.querySelector(".friend_last_online_text").textContent.match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/);
                let time = Infinity;
                if (lastOnline) {
                    let days = parseInt(lastOnline[1]) || 0;
                    let hours = parseInt(lastOnline[2]) || 0;
                    let minutes = parseInt(lastOnline[3]) || 0;
                    let downtime = (days * 24 + hours) * 60 + minutes;
                    time = downtime;
                }
                document.querySelector(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`).dataset.esSortTime = time;
            }
        }

        let offlineBlock = document.querySelector("#state_offline");
        let curOfflineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));

        let property = `esSort${sortBy === "default" ? "Default" : "Time"}`;
        curOfflineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

        for (let friend of curOfflineFriends) {
            if (reversed) {
                offlineBlock.insertAdjacentElement("afterend", friend);
            } else {
                offlineBlock.parentElement.appendChild(friend);
            }
        }
    }
}
