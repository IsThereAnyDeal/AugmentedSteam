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

    static async checkVersion(onUpdate) {
        const lastVersion = Version.fromString(SyncedStorage.get("version"));
        const currentVersion = Version.fromString(Info.version);

        if (currentVersion.isAfter(lastVersion)) {

            let changelogPromise = Promise.resolve();
            if (SyncedStorage.get("version_show")) {
                changelogPromise = this._showChangelog().catch(err => { console.error("Failed to show changelog: %o", err); });
            }

            await Promise.all([
                changelogPromise,
                this._migrateSettings(lastVersion),
                onUpdate(),
            ]);
        }

        SyncedStorage.set("version", Info.version);
    }

    static async _showChangelog() {

        const changelog = await ExtensionResources.getJSON("changelog.json");
        const html = changelog[Info.version];
        if (!html) {
            throw new Error(`Can't find changelog for version ${Info.version}`);
        }

        const logo = ExtensionResources.getURL("img/logo/as128.png");
        const githubChanges = `<p><a href="https://github.com/IsThereAnyDeal/AugmentedSteam/compare/v${SyncedStorage.get("version")}...v${Info.version}">All changes on GitHub</a></p>`;
        const dialog = `<div class="es_changelog"><img src="${logo}"><div>${html}${githubChanges}</div></div>`;

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

            if (SyncedStorage.has("showusernotes")) {
                const val = SyncedStorage.get("showusernotes");
                SyncedStorage.set("user_notes_app", val);
                SyncedStorage.set("user_notes_wishlist", val);
                SyncedStorage.remove("showusernotes");
            }
        }

        if (oldVersion.isSameOrBefore("2.1.0")) {
            SyncedStorage.remove("showcomparelinks");

            const links = SyncedStorage.get("profile_custom_link");
            for (const link of links) {
                if (link.url && !link.url.includes("[ID]")) {
                    link.url += "[ID]";
                }
            }
            SyncedStorage.set("profile_custom_link", links);
        }

        if (oldVersion.isSameOrBefore("2.2.1")) {
            Background.action("migrate.cachestorage");
        }
    }
}

export {UpdateHandler};
