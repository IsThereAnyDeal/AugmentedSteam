import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FFriendsSort from "./FFriendsSort";
import FInviteButton from "./FInviteButton";

export class CFriends extends CCommunityBase {

    constructor() {
        super([
            FFriendsSort,
            FInviteButton,
        ]);

        this.type = ContextType.FRIENDS;
    }
}
