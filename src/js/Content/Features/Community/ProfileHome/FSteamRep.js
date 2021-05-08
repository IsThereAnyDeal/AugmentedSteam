import {ExtensionResources, HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature, ProfileData, SteamId} from "../../../modulesContent";

export default class FSteamRep extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showsteamrepapi");
    }

    async apply() {

        const {steamrep} = await ProfileData || {};
        if (!steamrep || !steamrep.length) { return; }

        // Build reputation images regexp
        const repImgs = {
            "banned": /scammer|banned/i,
            "valve": /valve admin/i,
            "caution": /caution/i,
            "okay": /admin|middleman/i,
            "donate": /donator/i
        };

        let html = "";

        for (const value of steamrep) {

            if (value.trim() === "") { continue; }

            for (const [img, regex] of Object.entries(repImgs)) {
                if (!regex.test(value)) { continue; }

                const imgUrl = ExtensionResources.getURL(`img/sr/${img}.png`);
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
            const steamId = SteamId.getSteamId();

            HTML.afterBegin(".profile_rightcol",
                `<a id="es_steamrep" href="https://steamrep.com/profiles/${steamId}" target="_blank">
                    ${html}
                </a>`);
        }
    }
}
