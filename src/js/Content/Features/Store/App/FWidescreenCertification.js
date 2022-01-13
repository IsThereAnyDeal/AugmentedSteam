import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

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
        if (!SyncedStorage.get("showwsgf")
            || this.context.isDlcLike
            || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.wsgf) {
            return false;
        }

        this._data = result.wsgf;
        return true;
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

        HTML.afterEnd("div.game_details",
            `<div class="block responsive_apppage_details_right heading">${Localization.str.wsgf.certifications}</div>
            <div class="block underlined_links es_wsgf">
                <div class="block_content">
                    <div class="block_content_inner">
                        <div class="details_block">
                            ${wsg ? `<img src="${HTML.escape(wsgIcon)}" title="${HTML.escape(wsgText)}">` : ""}
                            ${mmg ? `<img src="${HTML.escape(mmgIcon)}" title="${HTML.escape(mmgText)}">` : ""}
                            ${uws ? `<img src="${HTML.escape(uwsIcon)}" title="${HTML.escape(uwsText)}">` : ""}
                            ${fkg ? `<img src="${HTML.escape(fkgIcon)}" title="${HTML.escape(fkgText)}">` : ""}
                        </div>
                        <br>
                        <a class="linkbar es_external_icon" target="_blank" href="${HTML.escape(path)}">${Localization.str.rating_details}</a>
                    </div>
                </div>
            </div>`);
    }
}
