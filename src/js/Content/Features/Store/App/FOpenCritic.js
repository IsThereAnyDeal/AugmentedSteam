import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FOpenCritic extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showoc")) { return false; }

        const result = await this.context.data;
        if (!result || !result.reviews || !result.reviews.opencritic) {
            return false;
        }

        this._review = result.reviews.opencritic;
        return true;
    }

    apply() {

        const review = this._review;
        const ocImg = ExtensionResources.getURL("img/opencritic.png");
        const award = review.verdict || "NA";

        let node = document.querySelector("#game_area_metascore");
        if (node) {
            node = node.parentNode;
        } else {
            node = document.querySelector(".game_details");
        }

        HTML.afterEnd(node,
            `<div class="block responsive_apppage_reviewblock">
                <div id="game_area_opencritic">
                    <div class="score ${award.toLowerCase()}">${review.score ? review.score : "--"}</div>
                    <div class="logo"><img src="${ocImg}"></div>
                    <div class="wordmark">
                        <div class="metacritic">OpenCritic</div>
                        <div id="game_area_metalink">${award} - <a href="${review.url}?utm_source=enhanced-steam-itad&utm_medium=average" target="_blank">${Localization.str.read_reviews}</a>
                            <img src="//store.cloudflare.steamstatic.com/public/images/ico/iconExternalLink.gif" border="0" align="bottom">
                        </div>
                    </div>
                </div>
                <div style="clear: both;"></div>
            </div>`);

        /*
         TODO missing data source, improve tracking
        let reviews = "";
        for (const review of data.reviews) {
            const date = new Date(review.date).toLocaleDateString();
            reviews += `<p>"${review.snippet}"<br>${review.dScore} - <a href="${review.rUrl}" target="_blank" data-tooltip-text="${review.author}, ${date}">${review.name}</a></p>`;
        }

        if (reviews) {
            const html = `<div id="es_opencritic_reviews">
                ${reviews}
                <div class="chart-footer">
                    ${Localization.str.read_more_reviews}
                    <a href="${data.url}?utm_source=enhanced-steam-itad&utm_medium=reviews" target="_blank">OpenCritic.com</a>
                </div>
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
        }
         */
    }
}
