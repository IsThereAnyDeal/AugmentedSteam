import {Feature} from "modules";

import {ExtensionResources, HTML, SyncedStorage} from "core";
import {SteamId} from "common";
import {ProfileData} from "community/common";

export default class FSteamRep extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showsteamrepapi");
    }

    async apply() {

        const data = await ProfileData;
        
        if (!data.steamrep || data.steamrep.length === 0) { return; }

        let steamId = SteamId.getSteamId();
        if (!steamId) { return; }

        // Build reputation images regexp
        let repImgs = {
            "banned": /scammer|banned/gi,
            "valve": /valve admin/gi,
            "caution": /caution/gi,
            "okay": /admin|middleman/gi,
            "donate": /donator/gi
        };

        let html = "";

        for (let value of data.steamrep) {

            if (value.trim() === "") { continue; }

            for (let [img, regex] of Object.entries(repImgs)) {
                if (!value.match(regex)) { continue; }

                let imgUrl = ExtensionResources.getURL(`img/sr/${img}.png`);
                let status;

                switch (img) {
                    case "banned":
                        status = "bad";
                        break;
                    case "caution":
                        status = "caution";
                        break;
                    case "valve":
                    case "okay":
                        status = "good";
                        break;
                    case "donate":
                        status = "neutral";
                        break;
                }

                html += `<div class="${status}"><img src="${imgUrl}"><span> ${value}</span></div>`;
            }
        }

        if (html) {

            HTML.afterBegin(".profile_rightcol",
                `<a id="es_steamrep" href="https://steamrep.com/profiles/${steamId}" target="_blank">
                    ${html}
                </a>`);
        }
    }
}
