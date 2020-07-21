import {ASFeature} from "modules/ASFeature";
import {ContextTypes} from "modules/ASContext";

import {HTML, Localization, SyncedStorage} from "core";

export class FDRMWarnings extends ASFeature {

    checkPrerequisites() {
        if (!SyncedStorage.get("showdrm")) { return false; }

        // Prevent false-positives
        return !this.context.type === ContextTypes.APP || (
            this.context.appid !== 21690 // Resident Evil 5, at Capcom's request
            && this.context.appid !== 1157970 // Special K
        );
    }

    apply() {

        let text = "";
        for (const node of document.querySelectorAll(".game_area_sys_req, #game_area_legal, .game_details, .DRM_notice")) {
            text += node.textContent.toLowerCase();
        }

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

        const drmNames = [];
        if (gfwl) { drmNames.push("Games for Windows Live"); }
        if (uplay) { drmNames.push("Ubisoft Uplay"); }
        if (securom) { drmNames.push("SecuROM"); }
        if (tages) { drmNames.push("Tages"); }
        if (stardock) { drmNames.push("Stardock Account Required"); }
        if (rockstar) { drmNames.push("Rockstar Social Club"); }
        if (kalypso) { drmNames.push("Kalypso Launcher"); }
        if (denuvo) { drmNames.push("Denuvo Anti-tamper"); }
        if (origin) { drmNames.push("EA Origin"); }
        if (xbox) { drmNames.push("Microsoft Xbox Live"); }

        let drmString;
        if (drmNames.length > 0) {
            drmString = this.context.type === ContextTypes.APP ? Localization.str.drm_third_party : Localization.str.drm_third_party_sub;
            drmString = drmString.replace("__drmlist__", `(${drmNames.join(", ")})`);

        } else { // Detect other DRM
            const regex = /\b(drm|account|steam)\b/i;
            if (this.context.type === ContextTypes.APP) {
                for (const node of document.querySelectorAll("#category_block > .DRM_notice")) {
                    const text = node.textContent;
                    if (regex.test(text)) {
                        drmString = text;
                        break;
                    }
                }
            } else {
                const node = document.querySelector(".game_details .details_block > p > b:last-of-type");
                const text = node.textContent + node.nextSibling.textContent;
                if (regex.test(text)) {
                    drmString = text;
                }
            }
        }

        if (drmString) {
            const node = document.querySelector("#game_area_purchase .game_area_description_bodylabel");
            if (node) {
                HTML.afterEnd(node, `<div class="game_area_already_owned es_drm_warning"><span>${drmString}</span></div>`);
            } else {
                HTML.afterBegin("#game_area_purchase", `<div class="es_drm_warning"><span>${drmString}</span></div>`);
            }
        }
    }
}
