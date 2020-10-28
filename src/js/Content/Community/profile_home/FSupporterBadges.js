import Config from "config";
import {HTML, Localization} from "../../../core_modules";
import {Feature} from "../../../Modules/content";
import {ProfileData} from "community/common";

export default class FSupporterBadges extends Feature {

    async apply() {

        const data = await ProfileData.promise();
        if (!data || !data.badges) { return; }

        const badgeCount = data.badges.length;
        if (!badgeCount) { return; }

        const profileBadges = document.querySelector(".profile_badges");
        if (!profileBadges) { return; }

        let html
            = `<div class="profile_badges" id="es_supporter_badges">
                    <div class="profile_count_link">
                        <a href="${Config.PublicHost}">
                            <span class="count_link_label">${Localization.str.es_supporter}</span>&nbsp;
                            <span class="profile_count_link_total">${badgeCount}</span>
                        </a>
                    </div>
                    <div class="profile_count_link_preview">`;


        for (const badge of data.badges) {
            if (badge.link) {
                html += `<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>${badge.title}"><a href="${badge.link}"><img class="badge_icon small" src="${badge.img}"></a></div>`;
            } else {
                html += `<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>${badge.title}"><img class="badge_icon small" src="${badge.img}"></div>`;
            }
        }

        html += "</div></div>";

        HTML.afterEnd(profileBadges, html);

        // eslint-disable-next-line new-cap, no-undef
        this.context.runInPageContext(() => { SetupTooltips({"tooltipCSSClass": "community_tooltip"}); });
    }
}
