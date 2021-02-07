import {GameId, HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature, Stats} from "../../../modulesContent";

export default class FGamelistAchievements extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showallachievements");
    }

    apply() {

        // Path of profile in view to retrieve achievement stats
        this._path = window.location.pathname.replace("/games", "");

        this._observer = new IntersectionObserver(entries => { this._addAchievementBars(entries); }, {
            "threshold": 0.7,
        });

        for (const node of document.querySelectorAll(".gameListRow")) {
            this._observer.observe(node);
        }
    }

    async _addAchievementBars(entries) {

        for (const entry of entries) {
            if (!entry.isIntersecting) { continue; }

            const node = entry.target;
            this._observer.unobserve(node);

            if (node.querySelector(".recentAchievements") || !node.querySelector("img[src$='/ico_stats.png']")) {
                continue;
            }

            const appid = GameId.getAppidFromId(node.id);
            const achieveBar = await Stats.getAchievementBarForGamelist(this._path, appid);
            if (!achieveBar) { continue; }

            HTML.afterBegin(node.querySelector(".gameListRowItem"), achieveBar);
        }
    }
}
