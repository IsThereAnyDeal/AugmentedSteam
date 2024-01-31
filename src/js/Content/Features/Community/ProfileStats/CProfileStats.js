import {GameId, HTMLParser, Language} from "../../../../modulesCore";
import {ContextType, RequestData, User} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";
import FShowHiddenAchievements from "./FShowHiddenAchievements";

export class CProfileStats extends CCommunityBase {

    constructor() {

        // Don't apply features if there's an error message (e.g. user doesn't own the game)
        if (document.querySelector(".profile_fatalerror") !== null) {
            super(ContextType.PROFILE_STATS);
            return;
        }

        super(ContextType.PROFILE_STATS, [
            FAchievementSort,
            FShowHiddenAchievements,
        ]);

        this.appid = GameId.getAppidImgSrc(
            document.querySelector(".gameLogo img")?.getAttribute("src")
        );
    }

    async getAchievementData() {
        if (this._data) { return this._data; }

        const params = new URLSearchParams();
        params.set("format", "json");
        params.set("access_token", await User.accessToken);
        params.set("appid", this.appid);
        params.set("language", Language.getCurrentSteamLanguage());
        params.set("x_requested_with", "AugmentedSteam");

        return RequestData.getJson(
            `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?${params.toString()}`,
            {"credentials": "omit"}
        );
    }
}
