import {ASFeature} from "modules/ASFeature";
import {ExtensionResources, HTML, SyncedStorage} from "core";
import {Localization} from "language";
import {ExtensionLayer} from "common";

export class FOpenCritic extends ASFeature {

    async checkPrerequisites() {
        if (SyncedStorage.get("showoc")) {
            const result = await this.context.data;
            return result && result.oc && result.oc.url;
        }
        return false;
    }

    async apply() {
        const data = (await this.context.data).oc;

        const ocImg = ExtensionResources.getURL("img/opencritic.png");
        const award = data.award || "NA";

        let node = document.querySelector("#game_area_metascore");
        if (node) {
            node = node.parentNode;
        } else {
            node = document.querySelector(".game_details");
        }

        HTML.afterEnd(node,
            `<div>
                <div class="block responsive_apppage_reviewblock">
                    <div id="game_area_opencritic">
                        <div class="score ${award.toLowerCase()}">${data.score ? data.score : "--"}</div>
                        <div class="logo"><img src="${ocImg}"></div>
                        <div class="wordmark">
                            <div class="metacritic">OpenCritic</div>
                            <div id="game_area_metalink">${award} - <a href="${data.url}?utm_source=enhanced-steam-itad&utm_medium=average" target="_blank">${Localization.str.read_reviews}</a>
                                <img src="https://steamstore-a.akamaihd.net/public/images/ico/iconExternalLink.gif" border="0" align="bottom">
                            </div>
                        </div>
                    </div>
                    <div style="clear: both;"></div>
                </div>
            </div>`);

        let reviews = "";
        for (const review of data.reviews) {
            const date = new Date(review.date).toLocaleDateString();
            reviews += `<p>"${review.snippet}"<br>${review.dScore} - <a href="${review.rUrl}" target="_blank" data-tooltip-text="${review.author}, ${date}">${review.name}</a></p>`;
        }

        if (reviews) {
            const html
                = `<div id="es_opencritic_reviews">
                    ${reviews}
                    <div class="chart-footer">${Localization.str.read_more_reviews} <a href="${data.url}?utm_source=enhanced-steam-itad&utm_medium=reviews" target="_blank">OpenCritic.com</a></div>
                </div>`;

            // Add data to the review section in the left column, or create one if that block doesn't exist
            const reviewsNode = document.getElementById("game_area_reviews");
            if (reviewsNode) {
                HTML.beforeEnd(reviewsNode, html);
            } else {
                HTML.beforeBegin(document.getElementById("game_area_description").parentElement.parentElement,
                    `<div id="game_area_reviews" class="game_area_description">
                        <h2>${Localization.str.reviews}</h2>
                        ${html}
                    </div>`);
            }

            ExtensionLayer.runInPageContext(() => { BindTooltips("#game_area_reviews", {"tooltipCSSClass": "store_tooltip"}); });
        }
    }
}
