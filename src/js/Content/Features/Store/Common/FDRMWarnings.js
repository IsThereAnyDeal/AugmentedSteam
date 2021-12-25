import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";

export default class FDRMWarnings extends Feature {

    checkPrerequisites() {
        if (!SyncedStorage.get("showdrm")) { return false; }

        // Prevent false-positives
        return !this.context.type === ContextType.APP || (
            this.context.appid !== 21690 // Resident Evil 5, at Capcom's request
            && this.context.appid !== 1157970 // Special K
        );
    }

    apply() {

        const isAppPage = this.context.type === ContextType.APP;

        function getTextFromDRMNotices() {
            if (!isAppPage) { return []; }

            const value = [];
            for (const node of document.querySelectorAll(".DRM_notice")) {
                if (!node.querySelector("a[onclick^=ShowEULA]")) {
                    value.push(node.textContent);
                }
            }
            return value;
        }

        function getTextFromGameDetails() {
            if (isAppPage) { return ""; } // Only bundle/sub pages have DRM info in game details

            let value = "";
            let node = document.querySelector(".language_list");
            if (!node) { return ""; }
            node = node.nextSibling;
            while (node !== null) {
                value += node.textContent;
                node = node.nextSibling;
            }
            return value;
        }

        let text = "";
        for (const node of document.querySelectorAll(".game_area_sys_req, #game_area_legal")) {
            text += node.textContent;
        }

        const drmNotices = getTextFromDRMNotices();
        text += drmNotices.join("");

        const gameDetails = getTextFromGameDetails();
        text += gameDetails;

        text = text.toLowerCase();

        // Games for Windows Live detection
        const gfwl
                = text.includes("games for windows live")
            || text.includes("games for windows - live")
            || text.includes("online play requires log-in to games for windows")
            || text.includes("installation of the games for windows live software")
            || text.includes("multiplayer play and other live features included at no charge")
            || text.includes("www.gamesforwindows.com/live");

        // Ubisoft Uplay detection
        const uplay
                = text.includes("uplay")
            || text.includes("ubisoft account");

        // Securom detection
        const securom = text.includes("securom");

        // Tages detection
        const tages
                = text.match(/\b(tages|solidshield)\b/)
            && !text.match(/angebote des tages/);

        // Stardock account detection
        const stardock = text.includes("stardock account");

        // Rockstar social club detection
        const rockstar
                = text.includes("rockstar social club")
            || text.includes("rockstar games social club");

        // Kalypso Launcher detection
        const kalypso = text.includes("requires a kalypso account");

        // Denuvo Antitamper detection
        const denuvo = text.includes("denuvo");

        // EA origin detection
        const origin = text.includes("origin client");

        // Microsoft Xbox Live account detection
        const xbox = text.includes("xbox live");

        const drmNames = [
            [gfwl, "Games for Windows Live"],
            [uplay, "Ubisoft Uplay"],
            [securom, "SecuROM"],
            [tages, "Tages"],
            [stardock, "Stardock Account Required"],
            [rockstar, "Rockstar Social Club"],
            [kalypso, "Kalypso Launcher"],
            [denuvo, "Denuvo Anti-tamper"],
            [origin, "EA Origin"],
            [xbox, "Microsoft Xbox Live"],
        ].flatMap(([enabled, name]) => { return enabled ? [name] : []; });

        let drmString;
        if (drmNames.length > 0) {
            drmString = isAppPage ? Localization.str.drm_third_party : Localization.str.drm_third_party_sub;
            drmString = drmString.replace("__drmlist__", `(${drmNames.join(", ")})`);
        } else {
            const regex = /\b(drm|account|steam)\b/i;

            // Display the first "DRM Notice" or the text in game details that matches DRM/3rd party accounts
            if (isAppPage) {
                drmString = drmNotices.find(text => regex.test(text));
            } else {
                drmString = regex.test(gameDetails) && gameDetails;
            }
        }

        if (drmString) {
            const html = `<div class="es_drm_warning"><span>${drmString}</span></div>`;

            // Insert the notice after the "Buy this game as a gift for a friend" note if present
            const node = document.querySelector("#game_area_purchase .game_area_description_bodylabel");
            if (node) {
                HTML.afterEnd(node, html);
            } else {
                HTML.afterBegin("#game_area_purchase, #game_area_purchase_top", html);
            }
        }
    }
}
