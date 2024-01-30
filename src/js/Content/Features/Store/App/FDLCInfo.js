import {ExtensionResources, HTML, Localization} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";
import Config from "../../../../config";

export default class FDLCInfo extends Feature {

    checkPrerequisites() {
        return this.context.isDlc;
    }

    async apply() {

        let response;

        try {
            response = await Background.action("dlcinfo", this.context.appid);
            // TODO remove when suggestion link is fixed
            if (!response || !response.length) { return; }
        } catch (err) {
            console.error(err);
            return;
        }

        let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.dlc_details}</div>
                   <div class="block es_dlc_info">
                   <div class="block_content"><div class="block_content_inner"><div class="details_block">`;

        for (const item of response) {
            const iconUrl = ExtensionResources.getURL(`/img/dlcicons/${encodeURIComponent(item.icon)}`);
            const title = HTML.escape(item.description);
            const name = HTML.escape(item.name);

            html += `<div class="game_area_details_specs">
                        <div class="icon"><img src="${iconUrl}"></div>
                        <a class="name" title="${title}">${name}</a>
                    </div>`;
        }

        html += "</div>";
        html += "</div></div></div>";

        HTML.beforeBegin(document.querySelector("#category_block"), html);
    }
}
