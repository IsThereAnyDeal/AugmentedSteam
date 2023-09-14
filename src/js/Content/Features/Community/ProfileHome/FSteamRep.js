import {ExtensionResources, HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FSteamRep extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showsteamrepapi")) { return false; }

        const result = await this.context.data;
        if (!result || !result.steamrep || !result.steamrep.length) {
            return false;
        }

        this._data = result.steamrep;
        return true;
    }

    apply() {

        // Build reputation images regexp
        const repImgs = {
            "banned": /scammer|banned/i,
            "valve": /valve admin/i,
            "caution": /caution/i,
            "okay": /admin|middleman/i,
            "donate": /donator/i
        };

        let html = "";

        for (const value of this._data) {

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
            HTML.afterBegin(".profile_rightcol",
                `<a id="es_steamrep" href="https://steamrep.com/profiles/${this.context.steamId}" target="_blank">
                    ${html}
                </a>`);
        }
    }
}
