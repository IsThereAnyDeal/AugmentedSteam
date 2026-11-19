import {__groups_leave, __groups_leaveGroupsConfirm,} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/Data/RequestData";
import Messenger from "@Content/Modules/Messaging/Messenger";
import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import {mount, unmount} from "svelte";
import ManageFriendsPanel from "@Content/Features/Community/FriendsAndGroups/Components/ManageFriendsPanel.svelte";
import ManageFriendsControl from "@Content/Features/Community/FriendsAndGroups/Components/ManageFriendsControl.svelte";
import ConfirmDialog from "@Core/Modals/ConfirmDialog";
import ConfirmLeaveGroupModal
    from "@Content/Features/Community/FriendsAndGroups/Components/ConfirmLeaveGroupModal.svelte";

export default class FGroupsManageButton extends Feature<CFriendsAndGroups> {

    readonly #endpoint: URL;

    constructor(context: CFriendsAndGroups) {
        super(context);
        this.#endpoint = new URL("friends/action", this.context.user.profileUrl);
    }

    override async isEnabled(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.myProfile) {
            return "Not your profile";
        }

        DOMHelper.insertScript("scriptlets/Community/FriendsAndGroups/groupsManager.js");
        this.context.onSubpageNav.subscribe(() => this.#callback(), true);

        return null;
    }

    #callback(): void {
        if (!document.getElementById("groups_list")) { return; }
        this.context.moveSearchBar();

        const groups = document.querySelectorAll(".group_block");
        if (groups.length === 0) { return; }

        const titleBarNode = document.querySelector<HTMLElement>(".title_bar");
        if (!titleBarNode) {
            console.error("Title bar not found")
            return;
        }

        mount(ManageFriendsControl, {
            target: titleBarNode
        });

        mount(ManageFriendsPanel, {
            target: titleBarNode.parentElement!,
            anchor: titleBarNode.nextElementSibling ?? undefined,
            props: {
                onleave: () => this.#leaveGroups()
            }
        });

        for (const group of groups) {
            group.classList.add("selectable");
            HTML.afterBegin(group,
                `<div class="indicator select_friend">
                    <input class="select_friend_checkbox" type="checkbox">
                </div>`);

            group.querySelector(".select_friend")!.addEventListener("click", () => {
                group.classList.toggle("selected");
                group.querySelector<HTMLInputElement>(".select_friend_checkbox")!
                    .checked = group.classList.contains("selected");

                Messenger.call(MessageHandler.GroupsManager, "updateSelection");
            });
        }
    }

    async #confirmLeaveAdmin(name: string, id: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            const modal = mount(ConfirmLeaveGroupModal, {
                target: document.body,
                props: {
                    name,
                    id,
                    onconfirm: () => {
                        unmount(modal);
                        resolve(true);
                    },
                    oncancel: () => {
                        unmount(modal);
                        resolve(false)
                    }
                }
            });
        });
    }

    async #confirmLeaveGroups(count: number): Promise<boolean> {
        return await ConfirmDialog({
            title: L(__groups_leave),
            body: L(__groups_leaveGroupsConfirm, {n: count})
        });
    }

    async #leaveGroups() {
        const selected: [string, HTMLElement][] = [];

        for (const group of document.querySelectorAll<HTMLElement>(".group_block.selected")) {
            const actions = group.querySelector(".actions")!;
            const admin = actions.querySelector("[href*='/edit']");
            const split = actions.querySelector("[onclick*=ConfirmLeaveGroup]")!
                .getAttribute("onclick")!
                .split(/'|"/);

            if (!split[1]) {
                continue;
            }

            const id: string = split[1];

            if (admin && split[3]) {
                const name: string = split[3];

                if (!await this.#confirmLeaveAdmin(name, id)) {
                    group.querySelector<HTMLElement>(".select_friend")!.click();
                    continue;
                }
            }

            selected.push([id, group]);
        }

        if (selected.length > 0) {
            if (await this.#confirmLeaveGroups(selected.length)) {
                for (const [id, group] of selected) {

                    try {
                        const response = await this.#leaveGroup(id);
                        const data = await response.json();

                        if (!data || !data.success) {
                            console.error(`Failed to leave group ${id}`);
                            continue;
                        }
                    } catch(e) {
                        console.error(e);
                        continue;
                    }

                    // Make sure to remove the row so it doesn't show up again when filtering
                    group.remove();
                }
            }
        }
    }

    #leaveGroup(id: string): Promise<Response> {
        if (!this.context.user.sessionId) {
            throw new Error("Unknown session id");
        }

        return RequestData.post(this.#endpoint, {
            "sessionid": this.context.user.sessionId,
            "steamid": this.context.user.steamId,
            "ajax": "1",
            "action": "leave_group",
            "steamids[]": id
        });
    }
}
