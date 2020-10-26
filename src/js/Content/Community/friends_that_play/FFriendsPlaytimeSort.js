import {Feature} from "modules";

import {Localization} from "../../../Core/Localization/Localization";
import {Sortbox} from "common";

export default class FFriendsPlaytimeSort extends Feature {

    apply() {

        const sorted = {};

        function onChange(key, reversed) {
            if (!sorted.default) {
                sorted.default = new Map();
                for (const block of document.querySelectorAll(".profile_friends")) {
                    if (block.querySelector(".friendBlockInnerLink")) {
                        sorted.default.set(block, Array.from(block.querySelectorAll(".friendBlock")));
                    }
                }
            }

            // This only happens for the first sort after playtime
            if (!sorted[key]) {
                if (key === "playtime") {
                    sorted[key] = new Map();
                    for (const [block, friends] of sorted.default) {
                        const friendsCopy = friends.slice();
                        friendsCopy.sort((a, b) => parseFloat(b.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0])
                            - parseFloat(a.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0]));
                        sorted[key].set(block, friendsCopy);
                    }
                }
            }

            for (const [block, friends] of sorted[key]) {
                for (const friend of friends) {
                    if (reversed) {
                        block.insertAdjacentElement("afterbegin", friend);
                    } else {
                        block.closest(".profile_friends").querySelector(":scope > :last-child")
                            .insertAdjacentElement("beforebegin", friend);
                    }
                }
            }
        }

        document.querySelector(".friendListSectionHeader").insertAdjacentElement("beforeend", Sortbox.get("friends_that_play", [
            ["default", Localization.str.theworddefault],
            ["playtime", Localization.str.playtime],
        ], "default", onChange));
    }
}
