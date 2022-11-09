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

        this._offlineFriends.forEach((friend, i) => { friend.dataset.esSortdefault = i; });

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

        const property = `esSort${sortBy}`;

        if (sortBy === "lastonline" && !this._friendsFetched) {

            this._friendsFetched = true;
            const data = await RequestData.getHttp("https://steamcommunity.com/my/friends/?ajax=1&l=english");
            const dom = HTMLParser.htmlToElement(data);
            const lastOnlineRegex = /Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/;

            for (const friend of dom.querySelectorAll(".friend_block_v2.persona.offline")) {

                // Doesn't exist when profile is private
                const lastOnline = friend.querySelector(".friend_last_online_text")?.textContent.match(lastOnlineRegex);

                let downtime = Infinity;
                if (lastOnline) {
                    const days = Number(lastOnline[1]) || 0;
                    const hours = Number(lastOnline[2]) || 0;
                    const minutes = Number(lastOnline[3]) || 0;
                    downtime = (((days * 24) + hours) * 60) + minutes;
                }
                document.querySelector(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`).dataset[property] = downtime;
            }
        }

        this._offlineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

        // reverse if otherwise, because nodes are inserted at the "afterend" position
        if (!reversed) {
            this._offlineFriends.reverse();
        }

        const offlineBlock = document.getElementById("state_offline");
        this._offlineFriends.forEach(friend => offlineBlock.after(friend));
    }
}
