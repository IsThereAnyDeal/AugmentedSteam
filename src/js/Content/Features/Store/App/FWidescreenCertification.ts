import {L} from "@Core/Localization/Localization";
import {
    __ratingDetails,
    __wsgf_certifications,
    __wsgf_gold,
    __wsgf_incomplete,
    __wsgf_limited,
    __wsgf_silver,
    __wsgf_unsupported,
} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";
import ExtensionResources from "@Core/ExtensionResources";
import HTML from "@Core/Html/Html";

export default class FWidescreenCertification extends Feature<CApp> {

    private readonly _levelMap = {
        "A": ["gold", __wsgf_gold],
        "B": ["silver", __wsgf_silver],
        "C": ["limited", __wsgf_limited],
        "Incomplete": ["incomplete", __wsgf_incomplete],
        "Unsupported": ["unsupported", __wsgf_unsupported]
    };

    private _wsgf: TStorePageData["wsgf"]|null=null;

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.showwsgf
            || this.context.isDlcLike
            || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.wsgf) {
            return false;
        }

        this._wsgf = result.wsgf;
        return true;
    }

    _getType(value: string, imgPrefix: string, typeName: string): [string, string] {

        let icon = "";
        let text = "";

        // @ts-ignore
        const [level, string] = this._levelMap[value] ?? [undefined, undefined];
        if (level) {
            icon = ExtensionResources.getURL(`img/wsgf/${imgPrefix}-${level}.png`);
            text = L(string, {"type": typeName});
        }
        return [icon, text];
    }

    override apply(): void {
        if (!this._wsgf) {
            return;
        }

        const {
            "url": url,
            "wide": wsg,
            "multi_monitor": mmg,
            "4k": fkg,
            "ultrawide": uws,
        } = this._wsgf;

        const [wsgIcon, wsgText] = this._getType(wsg, "ws", "Widescreen");
        const [mmgIcon, mmgText] = this._getType(mmg, "mm", "Multi-Monitor");
        const [uwsIcon, uwsText] = this._getType(uws, "uw", "Ultra-Widescreen");
        const [fkgIcon, fkgText] = this._getType(fkg, "4k", "4k UHD");

        HTML.afterEnd("div.game_details",
            `<div class="block responsive_apppage_details_right heading">${L(__wsgf_certifications)}</div>
            <div class="block underlined_links es_wsgf">
                <div class="block_content">
                    <div class="block_content_inner">
                        <div class="details_block">
                            ${wsg ? `<img src="${HTML.escape(wsgIcon)}" title="${HTML.escape(wsgText)}" alt="">` : ""}
                            ${mmg ? `<img src="${HTML.escape(mmgIcon)}" title="${HTML.escape(mmgText)}" alt="">` : ""}
                            ${uws ? `<img src="${HTML.escape(uwsIcon)}" title="${HTML.escape(uwsText)}" alt="">` : ""}
                            ${fkg ? `<img src="${HTML.escape(fkgIcon)}" title="${HTML.escape(fkgText)}" alt="">` : ""}
                        </div>
                        <br>
                        <a class="linkbar es_external_icon" target="_blank" href="${HTML.escape(url)}">${L(__ratingDetails)}</a>
                    </div>
                </div>
            </div>`);
    }
}
