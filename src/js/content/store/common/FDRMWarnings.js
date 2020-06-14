import { ASFeature } from "../../ASFeature.js";
import { HTML, SyncedStorage } from "../../../core.js";
import { CAppPage } from "../app/CAppPage.js";
import { Localization } from "../../../language.js";

export class FDRMWarnings extends ASFeature {

    checkPrerequisites() {
        if (!SyncedStorage.get("showdrm")) { return false; };

        // Prevent false-positives
        // TODO Replace this with less expensive check
        return !this.context instanceof CAppPage || (
                this.context.appid !== 21690    // Resident Evil 5, at Capcom's request
            &&  this.context.appid !== 1157970  // Special K
        );
    }

    apply() {
        
        let text = "";
        for (let node of document.querySelectorAll(".game_area_sys_req, #game_area_legal, .game_details, .DRM_notice")) {
            text += node.textContent.toLowerCase();
        }

        // Games for Windows Live detection
        let gfwl =
                text.includes("games for windows live")
            || text.includes("games for windows - live")
            || text.includes("online play requires log-in to games for windows")
            || text.includes("installation of the games for windows live software")
            || text.includes("multiplayer play and other live features included at no charge")
            || text.includes("www.gamesforwindows.com/live");

        // Ubisoft Uplay detection
        let uplay =
                text.includes("uplay")
            || text.includes("ubisoft account");

        // Securom detection
        let securom = text.includes("securom");

        // Tages detection
        let tages =
                text.match(/\b(tages|solidshield)\b/)
            && !text.match(/angebote des tages/);

        // Stardock account detection
        let stardock = text.includes("stardock account");

        // Rockstar social club detection
        let rockstar =
                text.includes("rockstar social club")
            || text.includes("rockstar games social club");

        // Kalypso Launcher detection
        let kalypso = text.includes("requires a kalypso account");

        // Denuvo Antitamper detection
        let denuvo = text.includes("denuvo");

        // EA origin detection
        let origin = text.includes("origin client");

        // Microsoft Xbox Live account detection
        let xbox = text.includes("xbox live");

        let drmNames = [];
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
            drmString = this.context instanceof CAppPage ? Localization.str.drm_third_party : Localization.str.drm_third_party_sub;
            drmString = drmString.replace("__drmlist__", `(${drmNames.join(", ")})`);

        } else { // Detect other DRM
            let regex = /\b(drm|account|steam)\b/i;
            if (this.context instanceof CAppPage) {
                for (let node of document.querySelectorAll("#category_block > .DRM_notice")) {
                    let text = node.textContent;
                    if (regex.test(text)) {
                        drmString = text;
                        break;
                    }
                }
            } else {
                let node = document.querySelector(".game_details .details_block > p > b:last-of-type");
                let text = node.textContent + node.nextSibling.textContent;
                if (regex.test(text)) {
                    drmString = text;
                }
            }
        }

        if (drmString) {
            let node = document.querySelector("#game_area_purchase .game_area_description_bodylabel");
            if (node) {
                HTML.afterEnd(node, `<div class="game_area_already_owned es_drm_warning"><span>${drmString}</span></div>`);
            } else {
                HTML.afterBegin("#game_area_purchase", `<div class="es_drm_warning"><span>${drmString}</span></div>`);
            }
        }
    }
}
