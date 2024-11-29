import HTMLParser from "@Core/Html/HtmlParser";
import SteamCommunityApiFacade from "@Content/Modules/Facades/SteamCommunityApiFacade";
import LegacyUser from "@Core/User/LegacyUser";
import type AppConfig from "@Core/AppConfig/AppConfig";
import ReactUser from "@Core/User/ReactUser";

export default class UserFactory {

    constructor(
        private readonly appConfig: AppConfig
    ) {}

    async createFromLegacy(): Promise<LegacyUser> {
        const user = new LegacyUser();

        const avatarNode = document.querySelector<HTMLAnchorElement>("#global_actions > a.user_avatar");

        try {
            if (avatarNode) {
                user.profileUrl = avatarNode.href;
                user.profilePath = avatarNode.pathname;

                const login = await SteamCommunityApiFacade.login(user.profilePath);
                user.isSignedIn = true;
                user.steamId = login.steamId;
            } else {
                await SteamCommunityApiFacade.logout();
            }
        } catch(e) {
            console.log(e);
        }

        try {
            let country = await SteamCommunityApiFacade.getStoreCountry();
            if (country) {
                user.storeCountry = country;
                return user;
            }

            let newCountry: string|null = null;

            // Check config first since it's the fastest and present on most pages
            const config = document.querySelector<HTMLElement>("#webui_config, #application_config");
            if (config) {
                newCountry = config.dataset.config
                    ? JSON.parse(config.dataset.config).COUNTRY
                    : null;
            } else if (window.location.hostname === "steamcommunity.com") {
                // This variable is present on market-related pages
                newCountry = HTMLParser.getStringVariable("g_strCountryCode");
            } else {
                newCountry = HTMLParser.getStringVariable(/GDynamicStore\.Init\(.+?,\s*'([A-Z]{2})'/);
            }

            if (!newCountry) {
                throw new Error("Script with user store country not found");
            }

            user.storeCountry = newCountry;
            await SteamCommunityApiFacade.setStoreCountry(newCountry);
        } catch(e) {
            console.group("Store country detection");
            console.warn("Failed to detect store country from page");
            console.error(e);
            console.groupEnd();
        }

        return user;
    }


    async createFromReact(): Promise<ReactUser> {
        const user = new ReactUser();

        if (this.appConfig.steamId && this.appConfig.steamId !== "0") {
            user.steamId = this.appConfig.steamId;
        }

        user.storeCountry = this.appConfig.countryCode!;

        if (this.appConfig.webApiToken) {
            user.webApiToken = this.appConfig.webApiToken;
        }

        return user;
    }
}

