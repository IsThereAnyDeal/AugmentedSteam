import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FFriendsSort} from "./FFriendsSort";
import {FInviteButton} from "./FInviteButton";

export class CFriends extends CCommunityBase {

    constructor() {
        super([
            FFriendsSort,
            FInviteButton,
        ]);

        this.type = ContextTypes.FRIENDS;
    }
}
