import {User} from "./User";
import {RequestData} from "./RequestData";

interface TAchievementProgress {
    appid: number,
    unlocked: number,
    total: number,
    percentage: number,
    all_unlocked: boolean,
    cache_time: number
}

export default class SteamApi {

    static async getAchievementsProgress(appid: number): Promise<TAchievementProgress> {
        let response: {
            response?: {
                achievement_progress: Array<TAchievementProgress>
            }
        };

        try {
            const token = await User.accessToken;
            const steamId = User.steamId;

            response = await RequestData.post(
                `https://api.steampowered.com/IPlayerService/GetAchievementsProgress/v1/?access_token=${token}`,
                {"steamid": steamId, "appids[0]": appid},
                {"credentials": "omit"}
            );
        } catch (err) {
            throw new Error("Failed to fetch achievements");
        }

        let data = response?.response?.achievement_progress?.[0];

        if (!data) {
            throw new Error("Failed to find achievements data");
        }

        return data;
    }

}
