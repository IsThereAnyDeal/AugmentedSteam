import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../core_modules";
import {Feature} from "../../../Modules/Content/Feature/Feature";

export default class FWidescreenCertification extends Feature {

    constructor(context) {
        super(context);

        this._levelMap = {
            "A": "gold",
            "B": "silver",
            "C": "limited",
            "Incomplete": "incomplete",
            "Unsupported": "unsupported"
        };
    }

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

    _getType(value, imgPrefix, typeName) {

        let icon = "";
        let text = "";

        const level = this._levelMap[value];
        if (level) {
            icon = ExtensionResources.getURL(`img/wsgf/${imgPrefix}-${level}.png`);
            text = Localization.str.wsgf[level].replace(/__type__/g, typeName);
        }
        return [icon, text];
    }

    apply() {

        const {
            "Path": path,
            "WideScreenGrade": wsg,
            "MultiMonitorGrade": mmg,
            "Grade4k": fkg,
            "UltraWideScreenGrade": uws,
        } = this._data;

        const [wsgIcon, wsgText] = this._getType(wsg, "ws", "Widescreen");
        const [mmgIcon, mmgText] = this._getType(mmg, "mm", "Multi-Monitor");
        const [uwsIcon, uwsText] = this._getType(uws, "uw", "Ultra-Widescreen");
        const [fkgIcon, fkgText] = this._getType(fkg, "4k", "4k UHD");

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
