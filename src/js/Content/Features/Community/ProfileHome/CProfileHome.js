import {Background, ContextType, FeatureManager, SteamId} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FCommunityProfileLinks from "./FCommunityProfileLinks";
import FWishlistProfileLink from "./FWishlistProfileLink";
import FSupporterBadges from "./FSupporterBadges";
import FCustomBackground from "./FCustomBackground";
import FProfileStoreLinks from "./FProfileStoreLinks";
import FSteamRep from "./FSteamRep";
import FProfileDropdownOptions from "./FProfileDropdownOptions";
import FInGameStoreLink from "./FInGameStoreLink";
import FCustomStyle from "./FCustomStyle";
import FTwitchShowcase from "./FTwitchShowcase";
import FChatDropdownOptions from "./FChatDropdownOptions";
import FViewSteamId from "./FViewSteamId";
import FPinnedBackground from "./FPinnedBackground";

export class CProfileHome extends CCommunityBase {

    constructor() {

        // Don't apply features if there's an error message (e.g. non-existent profile)
        if (document.getElementById("message") !== null) {
            super(ContextType.PROFILE_HOME);
            return;
        }

        super(ContextType.PROFILE_HOME, [
            FCommunityProfileLinks,
            FWishlistProfileLink,
            FSupporterBadges,
            FCustomBackground,
            FProfileStoreLinks,
            FSteamRep,
            FProfileDropdownOptions,
            FInGameStoreLink,
            FCustomStyle,
            FTwitchShowcase,
            FChatDropdownOptions,
            FViewSteamId,
            FPinnedBackground,
        ]);

        this.steamId = SteamId.getSteamId();
        this.isPrivateProfile = document.body.classList.contains("private_profile");
        this.data = this.profileDataPromise().catch(err => console.error(err));

        FEarlyAccess.show(document.querySelectorAll(".game_info_cap, .showcase_slot:not(.showcase_achievement)"));

        // Need to wait on custom background and style (LNY2020 may set the background) to be fetched and set
        FeatureManager.dependency(FPinnedBackground, [FCustomBackground, true], [FCustomStyle, true]);

        // Required for LNY2020 to check whether the profile has a (custom) background
        FeatureManager.dependency(FCustomStyle, [FCustomBackground, true])
    }

    profileDataPromise() {
        return Background.action("profile", this.steamId);
    }
}
