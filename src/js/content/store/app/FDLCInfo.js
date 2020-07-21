import {ASFeature} from "modules/ASFeature";
import {Background} from "common";
import Config from "config";
import {HTML, Localization} from "core";

export class FDLCInfo extends ASFeature {

    checkPrerequisites() {
        return this.context.isDlc();
    }

    async apply() {
        let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.dlc_details}</div>
                   <div class="block es_dlc_info">
                   <div class="block_content"><div class="block_content_inner"><div class="details_block">`;

        try {
            const response = await Background.action("dlcinfo", {"appid": this.context.appid, "appname": this.context.appName});

            for (const item of response) {
                const iconUrl = `${Config.PublicHost}/gamedata/icons/${encodeURIComponent(item.icon)}`;
                const title = HTML.escape(item.desc);
                const name = HTML.escape(item.name);

                html += `<div class="game_area_details_specs">
                            <div class="icon"><img src="${iconUrl}"></div>
                            <a class="name" title="${title}">${name}</a>
                        </div>`;
            }
        } finally {
            const suggestUrl = `${Config.PublicHost}/gamedata/dlc_category_suggest.php?appid=${this.context.appid}&appname=${encodeURIComponent(this.context.appName)}`;
            html += `</div>
                    <br><a class="linkbar" href="${suggestUrl}" target="_blank">${Localization.str.dlc_suggest} <img src="//store.steampowered.com/public/images/v5/ico_external_link.gif"></a>
                    </div></div></div>`;

            HTML.beforeBegin(document.querySelector("#category_block").parentNode, html);
        }
    }
}
