import {GameId, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, User} from "../../../modulesContent";

export default class FAchievementComparisonLink extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showcomparelinks");
    }

    callback(nodes) {

        for (const node of nodes) {

            if (!node.classList.contains("es_highlighted_owned") || !node.closest(".blotter_daily_rollup_line")) { continue; }

            const parent = node.parentNode;

            if (parent.nextElementSibling.tagName !== "IMG") { continue; }

            let friendProfileUrl = parent.querySelector("a[data-miniprofile]").href;
            if (!friendProfileUrl.endsWith("/")) {
                friendProfileUrl += "/";
            }

            if (friendProfileUrl === User.profileUrl) { continue; }

            node.classList.add("es_achievements");

            const compareLink = `${friendProfileUrl}stats/${GameId.getAppid(node)}/compare/#es-compare`;
            HTML.afterEnd(parent, `<a class="es_achievement_compare" href="${compareLink}" target="_blank">(${Localization.str.compare})</a>`);
        }
    }
}
