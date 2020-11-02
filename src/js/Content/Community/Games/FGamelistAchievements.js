import {GameId, HTML, SyncedStorage} from "../../../core_modules";
import {Feature, Stats, Viewport} from "../../../Modules/Content";

export default class FGamelistAchievements extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showallachievements");
    }

    apply() {

        // Path of profile in view to retrieve achievement stats
        this._path = window.location.pathname.replace("/games", "");

        document.addEventListener("scroll", () => {
            if (this._scrollTimeout) { window.clearTimeout(this._scrollTimeout); }
            this._scrollTimeout = window.setTimeout(this._addAchievements, 500);
        });

        this._addAchievements();
    }

    _addAchievements() {
        const nodes = document.querySelectorAll(".gameListRow:not(.es_achievements_checked)");
        let hadNodesInView = false;
        for (const node of nodes) {

            if (!Viewport.isElementInViewport(node)) {
                if (hadNodesInView) { break; }
                continue;
            }

            hadNodesInView = true;

            const appid = GameId.getAppidFromId(node.id);
            node.classList.add("es_achievements_checked");
            if (!node.innerHTML.match(/ico_stats\.png/)) { continue; }

            const hoursNode = node.querySelector("h5.hours_played");
            if (!hoursNode) { continue; }

            HTML.afterEnd(hoursNode, `<div class="es_recentAchievements" id="es_app_${appid}"></div>`);

            Stats.getAchievementBar(this._path, appid).then(achieveBar => {
                if (!achieveBar) { return; }

                HTML.inner(document.querySelector(`#es_app_${appid}`), achieveBar);
            }, err => {
                console.error(err);
            });
        }
    }
}
