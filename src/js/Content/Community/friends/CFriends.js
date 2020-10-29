import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../common/CCommunityBase";
import FFriendsSort from "./FFriendsSort";
import FInviteButton from "./FInviteButton";

export class CFriends extends CCommunityBase {

    constructor() {
        super(ContextType.FRIENDS, [
            FFriendsSort,
            FInviteButton,
        ]);
    }
}
