import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FFriendsCount from "./FFriendsCount";
import FFriendsPlaytimeSort from "./FFriendsPlaytimeSort";

export class CFriendsThatPlay extends CCommunityBase {

    constructor() {
        super(ContextType.FRIENDS_THAT_PLAY, [
            FFriendsCount,
            FFriendsPlaytimeSort,
        ]);

        this.appid = parseInt(window.location.pathname.match(/\/friendsthatplay\/(\d+)/)[1]);
    }
}
