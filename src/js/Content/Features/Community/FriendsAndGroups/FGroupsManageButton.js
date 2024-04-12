import {
    __all,
    __groups_actionGroups,
    __groups_leave,
    __groups_leaveAdminConfirm_currentlyAdmin,
    __groups_leaveAdminConfirm_wantToLeave,
    __groups_leaveGroupsConfirm,
    __groups_manageGroups,
    __groups_select,
    __inverse,
    __none,
} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature, ConfirmDialog, RequestData, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FGroupsManageButton extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myProfile;
    }

    setup() {
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
                            <span>${groupsStr.leave}</span>
                        </span>
                    </div>
                    <span id="selected_msg_err" class="selected_msg error hidden"></span>
                    <span id="selected_msg" class="selected_msg hidden">${groupsStr.selected.replace("__n__", '<span id="selected_count"></span>')}</span>
                </div>
            </div>`);

        for (const group of groups) {
            group.classList.add("selectable");
            HTML.afterBegin(group,
                `<div class="indicator select_friend">
                    <input class="select_friend_checkbox" type="checkbox">
                </div>`);

            group.querySelector(".select_friend").addEventListener("click", () => {
                group.classList.toggle("selected");
                group.querySelector(".select_friend_checkbox").checked = group.classList.contains("selected");
                Page.runInPageContext(() => { window.SteamFacade.updateSelection(); });
            });
        }

        document.querySelector("#manage_friends_control").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.toggleManageFriends(); });
        });

        document.querySelector("#es_select_all").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.selectAll(); });
        });

        document.querySelector("#es_select_none").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.selectNone(); });
        });

        document.querySelector("#es_select_inverse").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.selectInverse(); });
        });

        document.querySelector("#es_leave_groups").addEventListener("click", () => { this._leaveGroups(); });
    }

    async _leaveGroups() {
        this._endpoint = new URL("friends/action", User.profileUrl);
        const selected = [];

        for (const group of document.querySelectorAll(".group_block.selected")) {

            const actions = group.querySelector(".actions");
            const admin = actions.querySelector("[href*='/edit']");
            const split = actions.querySelector("[onclick*=ConfirmLeaveGroup]")
                .getAttribute("onclick")
                .split(/'|"/);
            const id = split[1];

            if (admin) {
                const name = split[3];

                const body = `${L(__groups_leaveAdminConfirm_currentlyAdmin, {
                    "name": `<a href="/gid/${id}" target="_blank">${name}</a>`
                })}<br>${L(__groups_leaveAdminConfirm_wantToLeave)}`;
                const result = await ConfirmDialog.open(L(__groups_leave), body);
                if (result !== "OK") {
                    group.querySelector(".select_friend").click();
                    continue;
                }
            }

            selected.push([id, group]);
        }

        if (selected.length > 0) {
            const body = L(__groups_leaveGroupsConfirm, {"n": selected.length});
            const result = await ConfirmDialog.open(L(__groups_leave), body);

            if (result === "OK") {
                for (const [id, group] of selected) {

                    const res = await this._leaveGroup(id).catch(err => console.error(err));

                    if (!res || !res.success) {
                        console.error(`Failed to leave group ${id}`);
                        continue;
                    }

                    // Make sure to remove the row so it doesn't show up again when filtering
                    group.remove();
                }
            }
        }
    }

    _leaveGroup(id) {
        const data = {
            "sessionid": User.sessionId,
            "steamid": User.steamId,
            "ajax": 1,
            "action": "leave_group",
            "steamids[]": id
        };

        return RequestData.post(this._endpoint, data);
    }
}
