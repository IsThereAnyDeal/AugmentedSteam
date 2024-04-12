import {__esSupporter} from "../../../../../localization/compiled/_strings";
import Config from "../../../../config";
import {L} from "../../../../Core/Localization/Localization";
import {ExtensionResources, HTML} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FSupporterBadges extends Feature {

    async checkPrerequisites() {
        if (this.context.isPrivateProfile) { return false; }

        const result = await this.context.data;
        if (!result || !result.badges || !result.badges.length) {
            return false;
        }

        this._data = result.badges;
        return true;
    }

    apply() {

        let html = `<div class="profile_badges" id="es_supporter_badges">
            <div class="profile_count_link">
                <a href="${Config.PublicHost}">
                    <span class="count_link_label">${L(__esSupporter)}</span>&nbsp;
                    <span class="profile_count_link_total">${this._data.length}</span>
                </a>
            </div>
            <div class="profile_count_link_preview">`;

        for (const badge of this._data) {
            const img = ExtensionResources.getURL(`/img/badges/${badge.img}`);

            if (badge.link) {
                html += `<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>${badge.title}">
                            <a href="${badge.link}"><img class="badge_icon small" src="${img}" /></a>
                        </div>`;
            } else {
                html += `<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>${badge.title}">
                            <img class="badge_icon small" src="${img}" />
                        </div>`;
            }
        }

        html += "</div></div>";

        HTML.afterEnd(".profile_badges", html);
    }
}
