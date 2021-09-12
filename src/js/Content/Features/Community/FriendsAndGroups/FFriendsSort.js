import {HTMLParser, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, RequestData, Sortbox} from "../../../modulesContent";

export default class FFriendsSort extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myProfile;
    }

    setup() {
        this.callback();
    }

    callback() {
        if (!document.getElementById("friends_list")) { return; }

        this._offlineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));
        if (this._offlineFriends.length <= 1) { return; }

        this._offlineFriends.forEach((friend, i) => { friend.dataset.esSortDefault = i; });

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
        this._offlineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

        const offlineBlock = document.querySelector("#state_offline");
        for (const friend of this._offlineFriends) {
            if (reversed) {
                offlineBlock.insertAdjacentElement("afterend", friend);
            } else {
                offlineBlock.parentElement.appendChild(friend);
            }
        }
    }
}
