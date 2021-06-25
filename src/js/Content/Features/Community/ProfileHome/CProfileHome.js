import {ContextType, ProfileData} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
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
import FProfileStatus from "./FProfileStatus";

export class CProfileHome extends CCommunityBase {

    constructor() {
        // If there is an error message, like profile does not exists.
        if (document.getElementById("message")) {
            super(ContextType.PROFILE_HOME);
            return;
        }

        if (window.location.hash === "#as-success") {

            /*
             * TODO This is a hack. It turns out, that clearOwn clears data, but immediately reloads them.
             *      That's why when we clear profile before going to API to store changes we don't get updated images
             *      when we get back.
             *      clearOwn shouldn't immediately reload.
             *
             *      Also, we are hoping for the best here, we should probably await?
             */
            ProfileData.clearOwn();
        }

        ProfileData.promise();

        super(ContextType.PROFILE_HOME, [
            FProfileStatus,
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
        ]);

        this.isPrivateProfile = document.body.classList.contains("private_profile");
    }
}
