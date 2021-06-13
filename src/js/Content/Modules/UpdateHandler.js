import {Version} from "../../Core/Version";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Info} from "../../Core/Info";
import {ExtensionResources} from "../../Core/ExtensionResources";
import {Localization} from "../../Core/Localization/Localization";
import {BackgroundSimple} from "../../Core/BackgroundSimple";
import {Background} from "./Background";
import {LocalStorage} from "../../Core/Storage/LocalStorage";
import {ITAD} from "./ITAD";
import {Page} from "../Features/Page";

class UpdateHandler {

    static checkVersion(onUpdate) {
        const lastVersion = Version.fromString(SyncedStorage.get("version"));
        const currentVersion = Version.fromString(Info.version);

        if (currentVersion.isAfter(lastVersion)) {
            if (SyncedStorage.get("version_show")) {
                this._showChangelog();
            }
            this._migrateSettings(lastVersion);
            onUpdate();
        }

        SyncedStorage.set("version", Info.version);
    }

    static async _showChangelog() {

        const changelog = await ExtensionResources.getJSON("changelog.json");
        const html = changelog[Info.version];
        if (!html) { return; }

        const logo = ExtensionResources.getURL("img/logo/as128.png");
        const dialog = `<div class="es_changelog"><img src="${logo}"><div>${html}</div></div>`;

        const connectBtn = document.querySelector("#itad_connect");
        function itadConnected() { connectBtn.replaceWith("✓"); }

        Page.runInPageContext(
            (updatedStr, dialog) => {
                window.SteamFacade.showAlertDialog(updatedStr, dialog);
            },
            [Localization.str.update.updated.replace("__version__", Info.version), dialog]
        );

        if (Version.fromString(Info.version).isSame(new Version(1, 4))) {

            if (await BackgroundSimple.action("itad.isconnected")) {
                itadConnected();
            } else {
                connectBtn.addEventListener("click", async() => {
                    await BackgroundSimple.action("itad.authorize");
                    ITAD.create();
                    itadConnected();
                });
            }
        }
    }

    static _migrateSettings(oldVersion) {

        if (oldVersion.isSameOrBefore("1.3.1")) {
            BackgroundSimple.action("cache.clear");

            SyncedStorage.set("horizontalscrolling", SyncedStorage.get("horizontalmediascrolling"));
            SyncedStorage.remove("horizontalmediascrolling");
        }

        if (oldVersion.isSameOrBefore("1.4")) {
            SyncedStorage.remove("show_sysreqcheck");
        }

        if (oldVersion.isSame("1.4")) {
            Background.action("migrate.notesToSyncedStorage");
        }

        if (oldVersion.isSameOrBefore("1.4.1")) {
            SyncedStorage.set("profile_steamid", SyncedStorage.get("profile_permalink"));
            SyncedStorage.remove("profile_permalink");
        }

        if (oldVersion.isSameOrBefore("1.4.3")) {
            SyncedStorage.remove("contscroll");
            Background.action("logout");
        }

        if (oldVersion.isSameOrBefore("1.4.7")) {
            const emoticons = LocalStorage.get("fav_emoticons");
            if (Array.isArray(emoticons)) {
                SyncedStorage.set("fav_emoticons", emoticons);
            }
        }

        if (oldVersion.isSameOrBefore("2.0.0")) {
            SyncedStorage.remove("showfakeccwarning");
            SyncedStorage.remove("hideaboutlinks");
        }

        if (oldVersion.isSameOrBefore("2.0.1")) {
            SyncedStorage.remove("hide_dlcunownedgames");
            SyncedStorage.remove("hide_wishlist");
            SyncedStorage.remove("hide_cart");
            SyncedStorage.remove("hide_notdiscounted");
            SyncedStorage.remove("hide_mixed");
            SyncedStorage.remove("hide_negative");
            SyncedStorage.remove("hide_priceabove");
            SyncedStorage.remove("priceabove_value");
            SyncedStorage.remove("hide_owned");
            SyncedStorage.remove("hide_ignored");
            SyncedStorage.remove("highlight_notdiscounted");

            SyncedStorage.remove("showallfriendsthatown");
        }
    }
}

export {UpdateHandler};
