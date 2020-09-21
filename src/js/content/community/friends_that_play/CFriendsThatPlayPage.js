import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FFriendsCount} from "community/friends_that_play/FFriendsCount";
import {FFriendsPlaytimeSort} from "community/friends_that_play/FFriendsPlaytimeSort";
import {FFriendsThatOwn} from "community/friends_that_play/FFriendsThatOwn";

export class CFriendsThatPlayPage extends CCommunityBase {

    constructor() {
        super([
            FFriendsCount,
            FFriendsPlaytimeSort,
            FFriendsThatOwn,
        ]);

        this.type = ContextTypes.FRIENDS_THAT_PLAY;

        this.appid = parseInt(window.location.pathname.match(/\/friendsthatplay\/(\d+)/)[1]);
    }
}
