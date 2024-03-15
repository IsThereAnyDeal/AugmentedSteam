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
        const githubLink = `https://github.com/IsThereAnyDeal/AugmentedSteam/compare/v${SyncedStorage.get("version")}...v${Info.version}`;
        const dialog = `<div class="es_changelog">
            <img src="${logo}">
            <div>
                ${html}
                <p><a href="${githubLink}" target="_blank">${Localization.str.update.changes}</a></p>
            </div>
        </div>`;

        Page.runInPageContext((title, html) => {
            window.SteamFacade.showAlertDialog(title, html);
        }, [Localization.str.update.updated.replace("__version__", Info.version), dialog]);
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

        if (oldVersion.isSameOrBefore("2.5.0")) {
            SyncedStorage.remove("replaceaccountname");
        }

        if (oldVersion.isSameOrBefore("3.0.0")) {
            const shopUpdateMap = {
                "adventureshop":1,"allyouplay":2,"amazonus":3,"battlenet":4,"bistore":5,"bundlestars":6,"coinplay":7,
                "cybermanta":8,"desura":9,"digitaldownload":10,"direct2drive":11,"discord":12,"dlgamer":13,"dotemu":14,
                "dreamgame":15,"epic":16,"fireflower":17,"funstock":18,"game2":19,"gamebillet":20,"gamefly":21,
                "gamejolt":22,"gameolith":23,"gamersgate":24,"gamesload":25,"gamesplanet":26,"gamesplanetde":27,
                "gamesplanetfr":28,"gamesplanetus":29,"gamesrepublic":30,"gamesrocket":31,"gametap":32,"gemly":33,
                "getgames":34,"gog":35,"greenmangaming":36,"humblestore":37,"humblewidgets":38,"chrono":39,
                "imperialgames":40,"impulse":41,"indiegalastore":42,"indiegamestand":43,"itchio":44,"lbostore":45,
                "less4games":46,"macgamestore":47,"microsoft":48,"newegg":49,"nuuvem":50,"oculus":51,"origin":52,"paradox":53,
                "playfield":54,"playism":55,"razer":56,"savemi":57,"shinyloot":58,"silagames":59,"squenix":60,"steam":61,
                "uplay":62,"voidu":63,"wingamestore":64,"joybuggy":65,"noctre":66,"etailmarket":67
            }

            const excluded = SyncedStorage.get("excluded_stores");
            const remapped = excluded
                .map(oldKey => shopUpdateMap[oldKey] ?? null)
                .filter(value => value);
            SyncedStorage.set("excluded_stores", remapped);
        }

        if (oldVersion.isSameOrBefore("3.1.0")) {
            SyncedStorage.remove("addtocart_no_redirect");
            SyncedStorage.remove("show_steamspy_info");
            SyncedStorage.remove("show_survey_info");
            SyncedStorage.remove("show_steamchart_info");
        }
    }
}

export {UpdateHandler};
