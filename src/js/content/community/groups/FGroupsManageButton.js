import {Feature} from "modules";

import {HTML, Localization} from "core";
import {ConfirmDialog, ExtensionLayer, RequestData, User} from "common";

export default class FGroupsManageButton extends Feature {

    checkPrerequisites() {
        return this.context.groups.length !== 0 && this.context.groups[0].querySelector(".actions") !== null;
    }

    apply() {

        let groupsStr = Localization.str.groups;

        HTML.beforeEnd(".title_bar", 
            `<button id="manage_friends_control" class="profile_friends manage_link btnv6_blue_hoverfade btn_medium btn_uppercase">
                <span>${groupsStr.manage_groups}</span>
            </button>`);

        HTML.afterEnd(".title_bar",
            `<div id="manage_friends" class="manage_friends_panel">
                <div class="row">${groupsStr.action_groups}
                    <span class="row">
                        <span class="dimmed">${groupsStr.select}</span>
                        <span class="selection_type" id="es_select_all">${Localization.str.all}</span>
                        <span class="selection_type" id="es_select_none">${Localization.str.none}</span>
                        <span class="selection_type" id="es_select_inverse">${Localization.str.inverse}</span>
                    </span>
                </div>
                <div class="row">
                    <span class="manage_action anage_action btnv6_lightblue_blue btn_medium btn_uppercase" id="es_leave_groups">
                        <span>${groupsStr.leave}</span>
                    </span>
                    <span id="selected_msg_err" class="selected_msg error hidden"></span>
                    <span id="selected_msg" class="selected_msg hidden">${groupsStr.selected.replace("__n__", `<span id="selected_count"></span>`)}</span>
                </div>
                <div class="row"></div>
            </div>`);

        for (let group of this.context.groups) {
            group.classList.add("selectable");
            HTML.afterBegin(group, 
                `<div class="indicator select_friend">
                    <input class="select_friend_checkbox" type="checkbox">
                </div>`);
            group.querySelector(".select_friend").addEventListener("click", () => {
                group.classList.toggle("selected");
                group.querySelector(".select_friend_checkbox").checked = group.classList.contains("selected");
                ExtensionLayer.runInPageContext(() => { UpdateSelection(); });
            });    
        }

        document.querySelector("#manage_friends_control").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { ToggleManageFriends(); });
        });

        document.querySelector("#es_select_all").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectAll(); });
        });

        document.querySelector("#es_select_none").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectNone(); });
        });

        document.querySelector("#es_select_inverse").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectInverse(); });
        });

        document.querySelector("#es_leave_groups").addEventListener("click", () => { this._leaveGroups(); });
    }

    async _leaveGroups() {
        let selected = [];

        for (let group of this.context.groups) {
            if (!group.classList.contains("selected")) {
                continue;
            }

            let actions = group.querySelector(".actions");
            let admin = actions.querySelector("[href*='/edit']");
            let split = actions.querySelector("[onclick*=ConfirmLeaveGroup]")
                .getAttribute("onclick").split(/'|"/);
            let id = split[1];

            if (admin) {
                let name = split[3];

                let body = Localization.str.groups.leave_admin_confirm.replace("__name__", `<a href=\\"/gid/${id}\\" target=\\"_blank\\">${name}</a>`);
                let result = await ConfirmDialog.open(Localization.str.groups.leave, body);
                let cont = (result === "OK");
                if (!cont) {
                    group.querySelector(".select_friend").click();
                    continue;
                }
            }

            selected.push([id, group]);
        }

        if (selected.length > 0) {
            let body = Localization.str.groups.leave_groups_confirm.replace("__n__", selected.length);
            let result = await ConfirmDialog.open(Localization.str.groups.leave, body);

            if (result === "OK") {
                for (let tuple of selected) {
                    let [id, group] = tuple;
                    let res = await this._leaveGroup(id).catch(err => console.error(err));

                    if (!res || !res.success) {
                        console.error("Failed to leave group " + id);
                        continue;
                    }

                    group.style.opacity = "0.3";
                    group.querySelector(".select_friend").click();
                }
            }
        }
    }

    _leaveGroup(id) {
        let formData = new FormData();
        formData.append("sessionid", User.getSessionId());
        formData.append("steamid", User.steamId);
        formData.append("ajax", 1);
        formData.append("action", "leave_group");
        formData.append("steamids[]", id);

        return RequestData.post(User.profileUrl + "/friends/action", formData, {
            withCredentials: true
        }, "json");
    }
}
