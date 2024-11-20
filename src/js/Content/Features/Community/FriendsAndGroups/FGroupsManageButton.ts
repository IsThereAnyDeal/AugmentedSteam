import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {
    __all,
    __groups_actionGroups,
    __groups_leave,
    __groups_leaveAdminConfirm_currentlyAdmin,
    __groups_leaveAdminConfirm_wantToLeave,
    __groups_leaveGroupsConfirm,
    __groups_manageGroups,
    __groups_select,
    __groups_selected,
    __inverse,
    __none,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";
import Messenger from "@Content/Modules/Messaging/Messenger";
import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FGroupsManageButton extends Feature<CFriendsAndGroups> {

    private _endpoint: URL|undefined;

    override checkPrerequisites(): boolean {
        return this.context.myProfile;
    }

    override apply(): void {
        DOMHelper.insertScript("scriptlets/Community/FriendsAndGroups/groupsManager.js");
        document.addEventListener("as_subpageNav", () => this.callback());
        this.callback();
    }

    callback() {
        if (!document.getElementById("groups_list")) { return; }

        const groups = document.querySelectorAll(".group_block");
        if (groups.length === 0) { return; }

        HTML.beforeEnd(".title_bar",
            `<button id="manage_friends_control" class="profile_friends manage_link btnv6_blue_hoverfade btn_medium btn_uppercase">
                <span>${L(__groups_manageGroups)}</span>
            </button>`);

        HTML.afterEnd(".title_bar",
            `<div id="manage_friends" class="manage_friends_panel">
                <div class="row">${L(__groups_actionGroups)}
                    <span class="row">
                        <span class="dimmed">${L(__groups_select)}</span>
                        <span class="selection_type" id="es_select_all">${L(__all)}</span>
                        <span class="selection_type" id="es_select_none">${L(__none)}</span>
                        <span class="selection_type" id="es_select_inverse">${L(__inverse)}</span>
                    </span>
                </div>
                <div class="row">
                    <div class="manage_friend_actions_ctn">
                        <span class="manage_action btnv6_lightblue_blue btn_small" id="es_leave_groups">
                            <span>${L(__groups_leave)}</span>
                        </span>
                    </div>
                    <span id="selected_msg_err" class="selected_msg error hidden"></span>
                    <span id="selected_msg" class="selected_msg hidden">${L(__groups_selected, {n: '<span id="selected_count"></span>'})}</span>
                </div>
            </div>`);

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

        document.querySelector("#manage_friends_control")!.addEventListener("click", () => {
            Messenger.call(MessageHandler.GroupsManager, "toggleManageFriends");
        });

        document.querySelector("#es_select_all")!.addEventListener("click", () => {
            Messenger.call(MessageHandler.GroupsManager, "selectAll");
        });

        document.querySelector("#es_select_none")!.addEventListener("click", () => {
            Messenger.call(MessageHandler.GroupsManager, "selectNone");
        });

        document.querySelector("#es_select_inverse")!.addEventListener("click", () => {
            Messenger.call(MessageHandler.GroupsManager, "selectInverse");
        });

        document.querySelector("#es_leave_groups")!
            .addEventListener("click", () => this._leaveGroups());
    }

    async _leaveGroups() {
        this._endpoint = new URL("friends/action", this.context.user.profileUrl);
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

            const id = split[1];

            if (admin && split[3]) {
                const name = split[3];

                const body = `${L(__groups_leaveAdminConfirm_currentlyAdmin, {
                    "name": `<a href="/gid/${id}" target="_blank">${name}</a>`
                })}<br>${L(__groups_leaveAdminConfirm_wantToLeave)}`;
                const result = await SteamFacade.showConfirmDialog(L(__groups_leave), body);
                if (result !== "OK") {
                    group.querySelector<HTMLElement>(".select_friend")!.click();
                    continue;
                }
            }

            selected.push([id, group]);
        }

        if (selected.length > 0) {
            const body = L(__groups_leaveGroupsConfirm, {"n": selected.length});
            const result = await SteamFacade.showConfirmDialog(L(__groups_leave), body);

            if (result === "OK") {
                for (const [id, group] of selected) {

                    try {
                        const response = await this._leaveGroup(id);
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

    _leaveGroup(id: string) {
        if (!this.context.user.sessionId) {
            throw new Error("Unknown session id");
        }

        const data = {
            "sessionid": this.context.user.sessionId,
            "steamid": this.context.user.steamId,
            "ajax": "1",
            "action": "leave_group",
            "steamids[]": id
        };

        return RequestData.post(this._endpoint!, data);
    }
}
