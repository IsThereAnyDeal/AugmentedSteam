import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";

export default class FDRMWarnings extends Feature {

    constructor(context) {
        super(context);

        // Exclude false-positives
        this._excludedAppids = [
            21690, // Resident Evil 5, at Capcom's request
        ];
    }

    checkPrerequisites() {
        if (!SyncedStorage.get("showdrm")) { return false; }

        return !this._excludedAppids.includes(this.context.appid);
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

        // Ubisoft Connect detection
        const ubisoft
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

        // EA app (Origin) detection
        const eaApp
                = text.includes("origin client")
            || text.includes("ea account")
            || text.includes("ea app");

        // Microsoft Xbox Live account detection
        const xbox = text.includes("xbox live");

        const drmNames = [
            [gfwl, "Games for Windows Live"],
            [ubisoft, "Ubisoft Connect"],
            [securom, "SecuROM"],
            [tages, "Tages"],
            [stardock, "Stardock Account required"],
            [rockstar, "Rockstar Social Club"],
            [kalypso, "Kalypso Launcher"],
            [denuvo, "Denuvo Anti-Tamper"],
            [eaApp, "EA app (Origin)"],
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
            HTML.afterBegin(
                "#game_area_purchase, #game_area_purchase_top",
                `<div class="es_drm_warning"><span>${drmString}</span></div>`
            );
        }
    }
}
