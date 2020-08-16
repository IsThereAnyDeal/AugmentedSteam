import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FFriendsSort} from "community/friends/FFriendsSort";
import {FInviteButton} from "community/friends/FInviteButton";

export class CFriendsPage extends CCommunityBase {

    constructor() {
        super([
            FFriendsSort,
        ]);

        this.type = ContextTypes.FRIENDS;
    }
}
