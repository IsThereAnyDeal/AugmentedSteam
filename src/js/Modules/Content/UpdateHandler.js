import {Version} from "../Core/Version";
import {SyncedStorage} from "../Core/Storage/SyncedStorage";
import {Info} from "../Core/Info";
import {ExtensionResources} from "../Core/ExtensionResources";
import {Localization} from "../Core/Localization/Localization";
import {BackgroundSimple} from "../Core/BackgroundSimple";
import {Background} from "./Background";
import {LocalStorage} from "../Core/Storage/LocalStorage";
import {RequestData} from "./RequestData";
import {ExtensionLayer} from "./ExtensionLayer";

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

        // FIXME
        const changelog = (await RequestData.getHttp(ExtensionResources.getURL("html/changelog_new.html"))).replace(/\r|\n/g, "").replace(/'/g, "\\'");
        const logo = ExtensionResources.getURL("img/es_128.png");
        const dialog = `<div class="es_changelog"><img src="${logo}"><div>${changelog}</div></div>`;

        const connectBtn = document.querySelector("#itad_connect");
        function itadConnected() { connectBtn.replaceWith("✓"); }

        ExtensionLayer.runInPageContext(
            (updatedStr, dialog) => { ShowAlertDialog(updatedStr, dialog); }, // eslint-disable-line new-cap, no-undef
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
    }
}

export {UpdateHandler};
