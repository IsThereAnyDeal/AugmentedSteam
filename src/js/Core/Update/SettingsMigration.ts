import Version from "@Core/Version";
import {SyncedStorage} from "@Core/Storage/SyncedStorage";
import {SettingsStore} from "@Options/Data/Settings";
import AccessToken from "@Background/Modules/IsThereAnyDeal/AccessToken";

export default class SettingsMigration {

    public static async migrate(oldVersion: Version): Promise<void> {
        const storage = new SyncedStorage<any>();

        if (oldVersion.isSameOrBefore("2.0.0")) {
            await storage.remove("showfakeccwarning");
            await storage.remove("hideaboutlinks");
        }

        if (oldVersion.isSameOrBefore("2.0.1")) {
            await storage.remove("hide_dlcunownedgames");
            await storage.remove("hide_wishlist");
            await storage.remove("hide_cart");
            await storage.remove("hide_notdiscounted");
            await storage.remove("hide_mixed");
            await storage.remove("hide_negative");
            await storage.remove("hide_priceabove");
            await storage.remove("priceabove_value");
            await storage.remove("hide_owned");
            await storage.remove("hide_ignored");
            await storage.remove("highlight_notdiscounted");
            await storage.remove("showallfriendsthatown");

            const showusernotes = storage.get("showusernotes");
            if (showusernotes !== undefined) {
                await SettingsStore.set("user_notes_app", Boolean(showusernotes));
                await SettingsStore.set("user_notes_wishlist", Boolean(showusernotes));
                await storage.remove("showusernotes");
            }
        }

        if (oldVersion.isSameOrBefore("2.1.0")) {
            await storage.remove("showcomparelinks");

            const links = await storage.get("profile_custom_link");
            for (const link of links) {
                if (link.url && !link.url.includes("[ID]")) {
                    link.url += "[ID]";
                }
            }
            await SettingsStore.set("profile_custom_link", links);
        }

        if (oldVersion.isSameOrBefore("2.3.3")) {
            const options = await storage.get("customize_apppage");
            for (const customizerKey of ["steamchart", "surveys", "steamspy"]) {
                if (Object.prototype.hasOwnProperty.call(options, customizerKey) && typeof options[customizerKey] === "boolean") {
                    delete options[customizerKey];
                }
            }

            await SettingsStore.set("customize_apppage", options);
        }

        if (oldVersion.isSameOrBefore("2.4.1")) {
            await storage.remove("showallachievements");
        }

        if (oldVersion.isSameOrBefore("2.5.0")) {
            await storage.remove("replaceaccountname");
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

            const excluded = await storage.get("excluded_stores");
            await SettingsStore.set("excluded_stores", excluded
                // @ts-ignore
                .map((oldKey: any) => shopUpdateMap[oldKey] ?? null)
                .filter((value: number|null) => value))
        }

        if (oldVersion.isSameOrBefore("3.1.0")) {
            await storage.remove("addtocart_no_redirect");
            await storage.remove("show_steamspy_info");
            await storage.remove("show_survey_info");
            await storage.remove("show_steamchart_info");
        }

        if (oldVersion.isSameOrBefore("4.0.1")) {
            await SettingsStore.set("itad_sync_library", (await storage.get("itad_import_library") ?? true));
            await SettingsStore.set("itad_sync_wishlist", (await storage.get("itad_import_wishlist") ?? true));
            await storage.remove("itad_import_library");
            await storage.remove("itad_import_wishlist");
            await AccessToken.clear(); // new scopes are required
        }

        if (oldVersion.isSameOrBefore("4.1.2")) {
            await storage.remove("showdeckcompat");
        }
    }
}
