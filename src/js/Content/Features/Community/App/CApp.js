import ContextType from "../../../Modules/Context/ContextType";
import {GameId} from "../../../../Core/GameId";
import {CCommunityBase} from "../CCommunityBase";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";

export class CApp extends CCommunityBase {

    constructor(type = ContextType.COMMUNITY_APP, features = []) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(type, features);

        this.appid = GameId.getAppid(window.location.href);

        FHighlightsTags.highlightTitle(this.appid);
    }
}
