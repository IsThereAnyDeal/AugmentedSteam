import {ExtensionResources, Info, Localization, SyncedStorage, Version} from "../../modulesCore";
import {Background} from "../modulesContent";

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
        const githubChanges = `<p><a href="https://github.com/IsThereAnyDeal/AugmentedSteam/compare/v${SyncedStorage.get("version")}...v${Info.version}" target="_blank">All changes on GitHub</a></p>`;
        const dialog = `<div class="es_changelog"><img src="${logo}"><div>${html}${githubChanges}</div></div>`;

        Page.runInPageContext(
            (updatedStr, dialog) => {
                window.SteamFacade.showAlertDialog(updatedStr, dialog);
            },
            [Localization.str.update.updated.replace("__version__", Info.version), dialog]
        );
    }

    static _migrateSettings(oldVersion) {
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

        if (oldVersion.isSameOrBefore("2.3.3")) {
            const options = SyncedStorage.get("customize_apppage");
            for (const [customizerKey, optionKey] of [
                ["steamchart", "show_steamchart_info"],
                ["surveys", "show_survey_info"],
                ["steamspy", "show_steamspy_info"],
            ]) {
                if (Object.prototype.hasOwnProperty.call(options, customizerKey) && typeof options[customizerKey] === "boolean") {
                    SyncedStorage.set(optionKey, options[customizerKey]);
                    delete options[customizerKey];
                }
            }

            SyncedStorage.set("customize_apppage", options);
        }

        if (oldVersion.isSameOrBefore("2.4.1")) {
            SyncedStorage.remove("showallachievements");
        }
    }
}

export {UpdateHandler};
