import {HTMLParser} from "../../../../modulesCore";
import {ContextType, RequestData} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";
import FShowHiddenAchievements from "./FShowHiddenAchievements";

export class CStats extends CCommunityBase {

    constructor() {

        // Don't apply features if there's an error message (e.g. user doesn't own the game)
        if (document.querySelector(".profile_fatalerror") !== null) {
            super(ContextType.COMMUNITY_STATS);
            return;
        }

        super(ContextType.COMMUNITY_STATS, [
            FAchievementSort,
            FShowHiddenAchievements,
        ]);
    }

    getAchievementData() {
        if (this._data) { return this._data; }

        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set("tab", "achievements");
        url.searchParams.set("panorama", "please");

        return RequestData.getHttp(url.toString()).then(result => {
            this._data = HTMLParser.getVariableFromText(result, "g_rgAchievements", "object");
            return this._data;
        });
    }
}
