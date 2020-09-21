import {ASFeature} from "modules";

import {ExtensionResources, HTML, Localization, SyncedStorage} from "core";

export class FWidescreenCertification extends ASFeature {

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

    apply() {

        const {
            "Path": path,
            "WideScreenGrade": wsg,
            "MultiMonitorGrade": mmg,
            "Grade4k": fkg,
            "UltraWideScreenGrade": uws,
        } = this._data;

        let wsg_icon = "",
            wsg_text = "",
            mmg_icon = "",
            mmg_text = "";
        let fkg_icon = "",
            fkg_text = "",
            uws_icon = "",
            uws_text = "";

        switch (wsg) {
        case "A":
            wsg_icon = ExtensionResources.getURL("img/wsgf/ws-gold.png");
            wsg_text = Localization.str.wsgf.gold.replace(/__type__/g, "Widescreen");
            break;
        case "B":
            wsg_icon = ExtensionResources.getURL("img/wsgf/ws-silver.png");
            wsg_text = Localization.str.wsgf.silver.replace(/__type__/g, "Widescreen");
            break;
        case "C":
            wsg_icon = ExtensionResources.getURL("img/wsgf/ws-limited.png");
            wsg_text = Localization.str.wsgf.limited.replace(/__type__/g, "Widescreen");
            break;
        case "Incomplete":
            wsg_icon = ExtensionResources.getURL("img/wsgf/ws-incomplete.png");
            wsg_text = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            wsg_icon = ExtensionResources.getURL("img/wsgf/ws-unsupported.png");
            wsg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Widescreen");
            break;
        }

        switch (mmg) {
        case "A":
            mmg_icon = ExtensionResources.getURL("img/wsgf/mm-gold.png");
            mmg_text = Localization.str.wsgf.gold.replace(/__type__/g, "Multi-Monitor");
            break;
        case "B":
            mmg_icon = ExtensionResources.getURL("img/wsgf/mm-silver.png");
            mmg_text = Localization.str.wsgf.silver.replace(/__type__/g, "Multi-Monitor");
            break;
        case "C":
            mmg_icon = ExtensionResources.getURL("img/wsgf/mm-limited.png");
            mmg_text = Localization.str.wsgf.limited.replace(/__type__/g, "Multi-Monitor");
            break;
        case "Incomplete":
            mmg_icon = ExtensionResources.getURL("img/wsgf/mm-incomplete.png");
            mmg_text = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            mmg_icon = ExtensionResources.getURL("img/wsgf/mm-unsupported.png");
            mmg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
            break;
        }

        switch (uws) {
        case "A":
            uws_icon = ExtensionResources.getURL("img/wsgf/uw-gold.png");
            uws_text = Localization.str.wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
            break;
        case "B":
            uws_icon = ExtensionResources.getURL("img/wsgf/uw-silver.png");
            uws_text = Localization.str.wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
            break;
        case "C":
            uws_icon = ExtensionResources.getURL("img/wsgf/uw-limited.png");
            uws_text = Localization.str.wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
            break;
        case "Incomplete":
            uws_icon = ExtensionResources.getURL("img/wsgf/uw-incomplete.png");
            uws_text = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            uws_icon = ExtensionResources.getURL("img/wsgf/uw-unsupported.png");
            uws_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
            break;
        }

        switch (fkg) {
        case "A":
            fkg_icon = ExtensionResources.getURL("img/wsgf/4k-gold.png");
            fkg_text = Localization.str.wsgf.gold.replace(/__type__/g, "4k UHD");
            break;
        case "B":
            fkg_icon = ExtensionResources.getURL("img/wsgf/4k-silver.png");
            fkg_text = Localization.str.wsgf.silver.replace(/__type__/g, "4k UHD");
            break;
        case "C":
            fkg_icon = ExtensionResources.getURL("img/wsgf/4k-limited.png");
            fkg_text = Localization.str.wsgf.limited.replace(/__type__/g, "4k UHD");
            break;
        case "Incomplete":
            fkg_icon = ExtensionResources.getURL("img/wsgf/4k-incomplete.png");
            fkg_text = Localization.str.wsgf.incomplete;
            break;
        case "Unsupported":
            fkg_icon = ExtensionResources.getURL("img/wsgf/4k-unsupported.png");
            fkg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "4k UHD");
            break;
        }

        let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.wsgf.certifications}</div>
                    <div class="block underlined_links es_wsgf">
                    <div class="block_content"><div class="block_content_inner"><div class="details_block"><center>`;

        if (wsg !== "Incomplete") { html += `<img src="${HTML.escape(wsg_icon)}" title="${HTML.escape(wsg_text)}">&nbsp;&nbsp;&nbsp;`; }
        if (mmg !== "Incomplete") { html += `<img src="${HTML.escape(mmg_icon)}" title="${HTML.escape(mmg_text)}">&nbsp;&nbsp;&nbsp;`; }
        if (uws !== "Incomplete") { html += `<img src="${HTML.escape(uws_icon)}" title="${HTML.escape(uws_text)}">&nbsp;&nbsp;&nbsp;`; }
        if (fkg !== "Incomplete") { html += `<img src="${HTML.escape(fkg_icon)}" title="${HTML.escape(fkg_text)}">&nbsp;&nbsp;&nbsp;`; }

        html += `</center></div>
                <br><a class="linkbar" target="_blank" href="${HTML.escape(path)}">${Localization.str.rating_details} <img src="//store.steampowered.com/public/images/v5/ico_external_link.gif"></a>
                </div></div></div>`;

        HTML.afterEnd("div.game_details", html);
    }
}
