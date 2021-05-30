import {CookieStorage} from "../../Core/Storage/CookieStorage";
import {HTMLParser} from "../../Core/Html/HtmlParser";
import {Background} from "./Background";
import {RequestData} from "./RequestData";

class User {

    static get storeCountry() {

        const url = new URL(window.location.href);

        let country;
        if (url.searchParams && url.searchParams.has("cc")) {
            country = url.searchParams.get("cc");
        } else {
            country = User._storeCountry;
            if (!country) {
                country = CookieStorage.get("steamCountry");
            }
        }

        if (!country) {
            console.warn("Failed to detect store country, falling back to US");
            country = "US";
        }

        return country.substr(0, 2);
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
                    if (!login) { return; }
                    User.isSignedIn = true;
                    User.steamId = login.steamId;
                });
        } else {
            loginPromise = Background.action("logout");
        }

        User._promise = loginPromise
            .then(() => Background.action("storecountry"))
            .catch(({message}) => { console.error(message); })
            .then(country => {
                if (country) {
                    User._storeCountry = country;
                    return null;
                }

                let newCountry;

                if (window.location.hostname.endsWith("steampowered.com")) {

                    // Search through all scripts in case the order gets changed or a new one gets added
                    for (const script of document.getElementsByTagName("script")) {
                        const match = script.textContent.match(/GDynamicStore\.Init\(.+?, '([A-Z]{2})/);
                        if (match) {
                            newCountry = match[1];
                            break;
                        }
                    }

                } else if (window.location.hostname === "steamcommunity.com") {
                    const config = document.querySelector("#webui_config,#application_config");
                    if (config) {
                        newCountry = JSON.parse(config.dataset.config).COUNTRY;
                    }
                }

                if (newCountry) {
                    User._storeCountry = newCountry;
                    return Background.action("storecountry", newCountry)
                        .catch(({message}) => { console.error(message); });
                } else {
                    throw new Error("Script with user store country not found");
                }

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
            User._sessionId = HTMLParser.getVariableFromDom("g_sessionID", "string");
        }
        return User._sessionId;
    }

    static getPurchaseDate(lang, appName) {
        const _appName = HTMLParser.clearSpecialSymbols(appName);
        return Background.action("purchases", _appName, lang);
    }
}

export {User};
