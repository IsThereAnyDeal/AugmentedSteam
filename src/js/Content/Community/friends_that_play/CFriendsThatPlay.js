import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FFriendsCount from "./FFriendsCount";
import FFriendsPlaytimeSort from "./FFriendsPlaytimeSort";
import FFriendsThatOwn from "./FFriendsThatOwn";

export class CFriendsThatPlay extends CCommunityBase {

    constructor() {
        super([
            FFriendsCount,
            FFriendsPlaytimeSort,
            FFriendsThatOwn,
        ]);

        this.type = ContextType.FRIENDS_THAT_PLAY;

        this.appid = parseInt(window.location.pathname.match(/\/friendsthatplay\/(\d+)/)[1]);
    }
}
