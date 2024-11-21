import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FFriendsCount from "./FFriendsCount";
import FFriendsPlaytimeSort from "./FFriendsPlaytimeSort";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CFriendsThatPlay extends CCommunityBase {

    constructor(params: ContextParams) {

        // Don't apply features if there's an error message (e.g. invalid or missing appid)
        if (document.querySelector(".profile_fatalerror") !== null) {
            super(params, ContextType.FRIENDS_THAT_PLAY, []);
            return;
        }

        super(params, ContextType.FRIENDS_THAT_PLAY, [
            FFriendsCount,
            FFriendsPlaytimeSort,
        ]);
    }
}
