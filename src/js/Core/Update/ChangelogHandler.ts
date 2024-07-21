import {L} from "@Core/Localization/Localization";
import Version from "@Core/Version";
import {__update_changes, __update_updated} from "@Strings/_strings";
import Info from "@Core/Info";
import Settings from "@Options/Data/Settings";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import ExtensionResources from "@Core/ExtensionResources";

export default class ChangelogHandler {

    static async checkVersion(): Promise<void> {

        const lastVersion = Version.fromString(Settings.version);
        const currentVersion = Version.fromString(Info.version);

        if (currentVersion.isAfter(lastVersion)) {
            await this._showChangelog(lastVersion);
        }

        Settings.version = Info.version;
    }

    private static async _showChangelog(lastVersion: Version): Promise<void> {
        if (!Settings.version_show) {
            return;
        }

        try {
            const changelog = await ExtensionResources.getJSON<Record<string, string>>("changelog.json");
            const html = changelog[Info.version];
            if (!html) {
                console.error(`Can't find changelog for version ${Info.version}`);
                return;
            }

            const logo = ExtensionResources.getURL("img/logo/as128.png");
            const githubLink = `https://github.com/IsThereAnyDeal/AugmentedSteam/compare/v${lastVersion}...v${Info.version}`;
            const dialog = `<div class="es_changelog">
                <img src="${logo}">
                <div>
                    ${html}
                    <p><a href="${githubLink}" target="_blank">${L(__update_changes)}</a></p>
                </div>
            </div>`;

            SteamFacade.showAlertDialog(
                L(__update_updated, {"version": Info.version}),
                dialog
            );
        } catch(e) {
            console.error("Failed to show changelog: %o", e);
        }
    }
}
