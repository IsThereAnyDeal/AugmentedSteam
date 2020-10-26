import {Feature} from "modules";

import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../core_modules";

export default class FWidescreenCertification extends Feature {

    async checkPrerequisites() {
        if (!this.context.isDlc() && SyncedStorage.get("showwsgf")) {
            const result = await this.context.data;
            if (result && result.wsgf) {
                this._data = result.wsgf;
                return true;
            }
        }
        return false;
    }

    // eslint-disable-next-line complexity -- Most paths are very similar and thus clear to the reader
    apply() {

        const {
            "Path": path,
            "WideScreenGrade": wsg,
            "MultiMonitorGrade": mmg,
            "Grade4k": fkg,
            "UltraWideScreenGrade": uws,
        } = this._data;

        let wsgIcon = "",
            wsgText = "",
            mmgIcon = "",
            mmgText = "";
        let fkgIcon = "",
            fkgText = "",
            uwsIcon = "",
            uwsText = "";

        switch (wsg) {
        case "A":
            wsgIcon = ExtensionResources.getURL("img/wsgf/ws-gold.png");
            wsgText = Localization.str.wsgf.gold.replace(/__type__/g, "Widescreen");
            break;
        case "B":
            wsgIcon = ExtensionResources.getURL("img/wsgf/ws-silver.png");
            wsgText = Localization.str.wsgf.silver.replace(/__type__/g, "Widescreen");
            break;
        case "C":
            wsgIcon = ExtensionResources.getURL("img/wsgf/ws-limited.png");
            wsgText = Localization.str.wsgf.limited.replace(/__type__/g, "Widescreen");
            break;
        case "Incomplete":
            wsgIcon = ExtensionResources.getURL("img/wsgf/ws-incomplete.png");
            wsgText = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            wsgIcon = ExtensionResources.getURL("img/wsgf/ws-unsupported.png");
            wsgText = Localization.str.wsgf.unsupported.replace(/__type__/g, "Widescreen");
            break;
        }

        switch (mmg) {
        case "A":
            mmgIcon = ExtensionResources.getURL("img/wsgf/mm-gold.png");
            mmgText = Localization.str.wsgf.gold.replace(/__type__/g, "Multi-Monitor");
            break;
        case "B":
            mmgIcon = ExtensionResources.getURL("img/wsgf/mm-silver.png");
            mmgText = Localization.str.wsgf.silver.replace(/__type__/g, "Multi-Monitor");
            break;
        case "C":
            mmgIcon = ExtensionResources.getURL("img/wsgf/mm-limited.png");
            mmgText = Localization.str.wsgf.limited.replace(/__type__/g, "Multi-Monitor");
            break;
        case "Incomplete":
            mmgIcon = ExtensionResources.getURL("img/wsgf/mm-incomplete.png");
            mmgText = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            mmgIcon = ExtensionResources.getURL("img/wsgf/mm-unsupported.png");
            mmgText = Localization.str.wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
            break;
        }

        switch (uws) {
        case "A":
            uwsIcon = ExtensionResources.getURL("img/wsgf/uw-gold.png");
            uwsText = Localization.str.wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
            break;
        case "B":
            uwsIcon = ExtensionResources.getURL("img/wsgf/uw-silver.png");
            uwsText = Localization.str.wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
            break;
        case "C":
            uwsIcon = ExtensionResources.getURL("img/wsgf/uw-limited.png");
            uwsText = Localization.str.wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
            break;
        case "Incomplete":
            uwsIcon = ExtensionResources.getURL("img/wsgf/uw-incomplete.png");
            uwsText = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            uwsIcon = ExtensionResources.getURL("img/wsgf/uw-unsupported.png");
            uwsText = Localization.str.wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
            break;
        }

        switch (fkg) {
        case "A":
            fkgIcon = ExtensionResources.getURL("img/wsgf/4k-gold.png");
            fkgText = Localization.str.wsgf.gold.replace(/__type__/g, "4k UHD");
            break;
        case "B":
            fkgIcon = ExtensionResources.getURL("img/wsgf/4k-silver.png");
            fkgText = Localization.str.wsgf.silver.replace(/__type__/g, "4k UHD");
            break;
        case "C":
            fkgIcon = ExtensionResources.getURL("img/wsgf/4k-limited.png");
            fkgText = Localization.str.wsgf.limited.replace(/__type__/g, "4k UHD");
            break;
        case "Incomplete":
            fkgIcon = ExtensionResources.getURL("img/wsgf/4k-incomplete.png");
            fkgText = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            fkgIcon = ExtensionResources.getURL("img/wsgf/4k-unsupported.png");
            fkgText = Localization.str.wsgf.unsupported.replace(/__type__/g, "4k UHD");
            break;
        }

        let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.wsgf.certifications}</div>
                    <div class="block underlined_links es_wsgf">
                    <div class="block_content"><div class="block_content_inner"><div class="details_block"><center>`;

        if (wsg !== "Incomplete") { html += `<img src="${HTML.escape(wsgIcon)}" title="${HTML.escape(wsgText)}">&nbsp;&nbsp;&nbsp;`; }
        if (mmg !== "Incomplete") { html += `<img src="${HTML.escape(mmgIcon)}" title="${HTML.escape(mmgText)}">&nbsp;&nbsp;&nbsp;`; }
        if (uws !== "Incomplete") { html += `<img src="${HTML.escape(uwsIcon)}" title="${HTML.escape(uwsText)}">&nbsp;&nbsp;&nbsp;`; }
        if (fkg !== "Incomplete") { html += `<img src="${HTML.escape(fkgIcon)}" title="${HTML.escape(fkgText)}">&nbsp;&nbsp;&nbsp;`; }

        html += `</center></div>
                <br><a class="linkbar" target="_blank" href="${HTML.escape(path)}">${Localization.str.rating_details} <img src="//store.steampowered.com/public/images/v5/ico_external_link.gif"></a>
                </div></div></div>`;

        HTML.afterEnd("div.game_details", html);
    }
}
