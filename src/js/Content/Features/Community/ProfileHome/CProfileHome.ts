import CCommunityBase from "../CCommunityBase";
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
import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import ContextType from "@Content/Modules/Context/ContextType";
import EarlyAccessUtils from "@Content/Modules/EarlyAccess/EarlyAccessUtils";
import HTMLParser from "@Core/Html/HtmlParser";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CProfileHome extends CCommunityBase {

    public readonly steamId: string|null = null;
    public readonly isPrivateProfile: boolean = true;
    public readonly data: Promise<TProfileData|null> = Promise.resolve(null);

    constructor(params: ContextParams) {

        // Don't apply features if there's an error message (e.g. non-existent profile)
        const hasFeatures = document.getElementById("message") === null;

        super(params, ContextType.PROFILE_HOME, hasFeatures ? [
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
        ] : []);

        if (!hasFeatures) {
            return;
        }

        this.steamId = this.getSteamId();
        this.isPrivateProfile = document.body.classList.contains("private_profile");
        if (this.steamId) {
            this.data = AugmentedSteamApiFacade.getProfileData(this.steamId)
                .catch(e => {
                    console.error(e);
                    return null;
                });
        }

        EarlyAccessUtils.show(this.language, document.querySelectorAll(".game_info_cap, .showcase_slot:not(.showcase_achievement)"));

        // Need to wait on custom background and style (LNY2020 may set the background) to be fetched and set
        this.dependency(FPinnedBackground,
            [FCustomBackground, true], [FCustomStyle, true]
        );

        // Required for LNY2020 to check whether the profile has a (custom) background
        this.dependency(FCustomStyle,
            [FCustomBackground, true]
        )
    }

    private getSteamId(): string|null {
        let steamId: string|null = null;

        // Try to get steamid from the deprecated "report abuse" form (only appears when logged in)
        const node = document.querySelector<HTMLInputElement>("input[name=abuseID]");
        if (node) {
            steamId = node.value;
        } else {
            steamId = HTMLParser.getStringVariable("g_steamID");
        }

        if (!steamId) {
            const profileData = HTMLParser.getObjectVariable("g_rgProfileData");
            steamId = profileData?.steamid ?? null;
        }

        return steamId;
    }
}
