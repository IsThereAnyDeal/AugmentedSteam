import HTMLParser from "@Core/Html/HtmlParser";
import {StringUtils} from "@Core/Utils/StringUtils";
import {Background} from "./Background";
import {RequestData} from "./RequestData";

class User {

    static get storeCountry() {

        let country;

        const params = new URLSearchParams(window.location.search);
        if (params.has("cc")) {
            // Support overrides, though this only works when logged out now
            country = params.get("cc");
        } else {
            country = User._storeCountry;
        }

        if (!country) {
            console.warn("Failed to detect store country, falling back to US");
            country = "US";
        }

        return country;
    }

    static promise() {
        if (User._promise) { return User._promise; }

        const avatarNode = document.querySelector("#global_actions > a.user_avatar");
        let loginPromise;

        if (avatarNode) {
            User.profileUrl = avatarNode.href;
            User.profilePath = avatarNode.pathname;

            loginPromise = Background.action("login", User.profilePath)
                .then(login => {
                    User.isSignedIn = true;
                    User.steamId = login.steamId;
                });
        } else {
            loginPromise = Background.action("logout");
        }

        User._promise = loginPromise
            .then(() => Background.action("storecountry"))
            .catch(err => { console.error(err); })
            .then(country => {
                if (country) {
                    User._storeCountry = country;
                    return null;
                }

                let newCountry;

                // Check config first since it's the fastest and present on most pages
                const config = document.querySelector("#webui_config, #application_config");
                if (config) {
                    newCountry = JSON.parse(config.dataset.config).COUNTRY;
                } else if (window.location.hostname === "steamcommunity.com") {
                    // This variable is present on market-related pages
                    newCountry = HTMLParser.getStringVariable("g_strCountryCode");
                } else {
                    newCountry = HTMLParser.getStringVariable(/GDynamicStore\.Init\(.+?,\s*'([A-Z]{2})'/);
                }

                if (!newCountry) {
                    throw new Error("Script with user store country not found");
                }

                User._storeCountry = newCountry;
                return Background.action("storecountry", newCountry);
            })
            .catch(err => {
                console.group("Store country detection");
                console.warn("Failed to detect store country from page");
                console.error(err);
                console.groupEnd();
            });

        return User._promise;
    }

    static then(onDone, onCatch) {
        return User.promise().then(onDone, onCatch);
    }

    static get sessionId() {
        if (!User._sessionId) {
            User._sessionId = HTMLParser.getStringVariable("g_sessionID");
        }
        return User._sessionId;
    }

    static getPurchaseDate(lang, appName) {
        const _appName = StringUtils.clearSpecialSymbols(appName);
        return Background.action("purchases", _appName, lang);
    }

    /*
     * Retrieve user access token to use in new style WebAPI calls (Services)
     * https://github.com/Revadike/UnofficialSteamWebAPI/wiki/Get-Points-Summary-Config
     */
    static get accessToken() {
        if (User._accessToken) { return User._accessToken; }

        // This endpoint works on both store and community
        return RequestData.getJson(`${window.location.origin}/pointssummary/ajaxgetasyncconfig`).then(response => {
            if (!response || !response.success) {
                throw new Error("Failed to get webapi token");
            }

            User._accessToken = response.data.webapi_token;
            return User._accessToken;
        });
    }
}

export {User};
