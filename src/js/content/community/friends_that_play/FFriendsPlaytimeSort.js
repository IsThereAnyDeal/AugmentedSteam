import {ASFeature} from "modules";

import {Localization} from "core";
import {Sortbox} from "common";

export class FFriendsPlaytimeSort extends ASFeature {

    apply() {

        let sorted = {};

        document.querySelector(".friendListSectionHeader").insertAdjacentElement("beforeend", Sortbox.get("friends_that_play", [
            ["default", Localization.str.theworddefault],
            ["playtime", Localization.str.playtime],
        ], "default", onChange));

        function onChange(key, reversed) {
            if (!sorted.default) {
                sorted.default = new Map();
                for (let block of document.querySelectorAll(".profile_friends")) {
                    if (block.querySelector(".friendBlockInnerLink")) {
                        sorted.default.set(block, Array.from(block.querySelectorAll(".friendBlock")));
                    }
                }
            }

            // This only happens for the first sort after playtime
            if (!sorted[key]) {
                if (key === "playtime") {
                    sorted[key] = new Map();
                    for (let [block, friends] of sorted.default) {
                        let friendsCopy = friends.slice();
                        friendsCopy.sort((a, b) =>
                            parseFloat(b.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0]) -
                            parseFloat(a.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0])
                        );
                        sorted[key].set(block, friendsCopy);
                    }
                }                
            }

            for (let [block, friends] of sorted[key]) {
                for (let friend of friends) {
                    if (reversed) {
                        block.insertAdjacentElement("afterbegin", friend);
                    } else {
                        block.closest(".profile_friends").querySelector(":scope > :last-child").insertAdjacentElement("beforebegin", friend);
                    }
                }
            }
        }
    }
}
