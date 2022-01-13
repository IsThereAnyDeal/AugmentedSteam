import {HTML, Localization} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";
import Config from "../../../../config";

export default class FDLCInfo extends Feature {

    checkPrerequisites() {
        return this.context.isDlc;
    }

    async apply() {

        let response;

        try {
            response = await Background.action("dlcinfo", {"appid": this.context.appid, "appname": this.context.appName});
            // TODO remove when suggestion link is fixed
            if (!response || !response.length) { return; }
        } catch (err) {
            console.error(err);
            return;
        }

        // const suggestUrl = `${Config.PublicHost}/gamedata/dlc_category_suggest.php?appid=${this.context.appid}&appname=${encodeURIComponent(this.context.appName)}`;

        let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.dlc_details}</div>
                   <div class="block es_dlc_info">
                   <div class="block_content"><div class="block_content_inner"><div class="details_block">`;

        for (const item of response) {
            const iconUrl = `${Config.PublicHost}/gamedata/icons/${encodeURIComponent(item.icon)}`;
            const title = HTML.escape(item.desc);
            const name = HTML.escape(item.name);

            html += `<div class="game_area_details_specs">
                        <div class="icon"><img src="${iconUrl}"></div>
                        <a class="name" title="${title}">${name}</a>
                    </div>`;
        }

        html += "</div>";
        // html += `<br><a class="linkbar es_external_icon" href="${suggestUrl}" target="_blank">${Localization.str.dlc_suggest}</a>`;
        html += "</div></div></div>";

        HTML.beforeBegin(document.querySelector("#category_block"), html);
    }
}
