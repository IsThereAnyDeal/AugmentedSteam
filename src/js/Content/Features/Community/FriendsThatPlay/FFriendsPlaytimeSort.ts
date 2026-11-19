import {__playtime, __theworddefault} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CFriendsThatPlay from "@Content/Features/Community/FriendsThatPlay/CFriendsThatPlay";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import {L} from "@Core/Localization/Localization";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FFriendsPlaytimeSort extends Feature<CFriendsThatPlay> {

    #sorted: Record<string, Map<Element, Element[]>> = {};

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const target = document.querySelector(".friendListSectionHeader");
        if (!target) {
            throw new MountTargetError();
        }

        mount(SortBox, {
            target,
            props: {
                name: "friends_that_play",
                options: [
                    ["default", L(__theworddefault)],
                    ["playtime", L(__playtime)],
                ],
                value: "default_ASC",
                onchange: (_value: string, key: string, direction: number) => {
                    this.#sort(key, direction < 0);
                }
            }
        });

        return null;
    }

    #sort(key: string, reversed: boolean) {

        if (!this.#sorted.default) {
            this.#sorted.default = new Map();
            for (const block of document.querySelectorAll(".profile_friends")) {
                if (block.querySelector(".friendBlockInnerLink")) {
                    this.#sorted.default.set(block, Array.from(block.querySelectorAll(".friendBlock")));
                }
            }
        }

        // This only happens for the first sort after playtime
        if (!this.#sorted[key]) {
            if (key === "playtime") {
                function sortValue(node: Element) {
                    const value = node.querySelector(".friendSmallText")?.textContent?.match(/(\d+(\.\d+)?)/);
                    return value ? Number(value[0]) : 0;
                }

                this.#sorted[key] = new Map();
                for (const [block, friends] of this.#sorted.default) {
                    const friendsCopy = friends.slice();
                    friendsCopy.sort((a, b) => sortValue(b) - sortValue(a));
                    this.#sorted[key]!.set(block, friendsCopy);
                }
            }
        }

        for (const [block, friends] of (this.#sorted[key] ?? [])) {
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
}
