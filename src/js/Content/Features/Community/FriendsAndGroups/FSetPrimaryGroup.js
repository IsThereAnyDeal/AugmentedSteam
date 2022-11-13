import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature, RequestData, User} from "../../../modulesContent";

export default class FSetPrimaryGroup extends CallbackFeature {

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

        const primaryGroup = document.getElementById("primaryGroupBreak")?.previousElementSibling;
        if (!primaryGroup || !primaryGroup.classList.contains("group_block")) { return; }

        // Remove old indicator since it doesn't appear for some reason
        document.getElementById("primaryGroupBreak").remove();

        // Indicator for favorite group
        const indicator = HTML.element(`<div class="as_primary_group_text">${Localization.str.groups.primary}</div>`);

        primaryGroup.classList.add("as_primary_group");
        primaryGroup.querySelector(".group_block_details").append(indicator);

        for (const group of groups) {
            HTML.afterBegin(group.querySelector(".actions"),
                `<a class="linkStandard btnv6_blue_hoverfade btn_small_tall as_set_primary_btn">
                    <span>${Localization.str.groups.set_primary}</span>
                </a>`);
        }

        document.getElementById("search_results").addEventListener("click", async e => {
            const btn = e.target.closest(".as_set_primary_btn");
            if (!btn) { return; }

            const groupSteamId = btn.nextElementSibling.getAttribute("onclick").match(/ConfirmLeaveGroup\(\s*'(\d+)'/)[1];

            const formData = new FormData();
            formData.append("sessionID", User.sessionId);
            formData.append("primary_group_steamid", groupSteamId);
            formData.append("type", "favoriteclan");
            formData.append("json", 1);

            const result = await RequestData.post(`${User.profileUrl}edit/`, formData, {}, true);
            if (result.success !== 1) {
                console.error("Failed to set featured group: %s", result.errmsg);
                return;
            }

            document.querySelector(".group_block.as_primary_group").classList.remove("as_primary_group");
            const group = btn.closest(".group_block");
            group.classList.add("as_primary_group");
            group.querySelector(".group_block_details").append(indicator);
        });
    }
}
