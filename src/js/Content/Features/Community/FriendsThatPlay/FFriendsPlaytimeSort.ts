import {__playtime, __theworddefault} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CFriendsThatPlay from "@Content/Features/Community/FriendsThatPlay/CFriendsThatPlay";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import {L} from "@Core/Localization/Localization";
import type {SortboxChangeEvent} from "@Content/Modules/Widgets/SortboxChangeEvent";

export default class FFriendsPlaytimeSort extends Feature<CFriendsThatPlay> {

    override apply(): void {

        const sorted: Record<string, Map<Element, Element[]>> = {};

        function onChange(key: string, reversed: boolean) {
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
                    function sortValue(node: Element) {
                        const value = node.querySelector(".friendSmallText")?.textContent?.match(/(\d+(\.\d+)?)/);
                        return value ? Number(value[0]) : 0;
                    }

                    sorted[key] = new Map();
                    for (const [block, friends] of sorted.default) {
                        const friendsCopy = friends.slice();
                        friendsCopy.sort((a, b) => sortValue(b) - sortValue(a));
                        sorted[key]!.set(block, friendsCopy);
                    }
                }
            }

            for (const [block, friends] of (sorted[key] ?? [])) {
                for (const friend of friends) {
                    if (reversed) {
                        block.insertAdjacentElement("afterbegin", friend);
                    } else {
                        block.closest(".profile_friends")
                            ?.querySelector(":scope > :last-child")
                            ?.insertAdjacentElement("beforebegin", friend);
                    }
                }
            }
        }

        const target = document.querySelector(".friendListSectionHeader");
        if (!target) { return; }

        const sortbox = new SortBox({
            target,
            props: {
                name: "friends_that_play",
                options: [
                    ["default", L(__theworddefault)],
                    ["playtime", L(__playtime)],
                ],
                value: "default_ASC"
            }
        });
        sortbox.$on("change", (e: CustomEvent<SortboxChangeEvent>) => {
            const {key, direction} = e.detail;
            onChange(key, direction < 0);
        });
    }
}
