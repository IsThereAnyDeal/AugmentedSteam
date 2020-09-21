import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FFriendsSort} from "community/friends/FFriendsSort";
import {FInviteButton} from "community/friends/FInviteButton";

export class CFriendsPage extends CCommunityBase {

    constructor() {
        super([
            FFriendsSort,
            FInviteButton,
        ]);

        this.type = ContextTypes.FRIENDS;
    }
}
