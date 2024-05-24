import Feature from "@Content/Modules/Context/Feature";
import ExtensionResources from "@Core/ExtensionResources";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import {__readReviews} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";


export default class FOpenCritic extends Feature<CApp> {

    private _review: TStorePageData['reviews']['opencritic']|null = null;

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.showoc) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.reviews || !result.reviews.opencritic) {
            return false;
        }

        this._review = result.reviews.opencritic;
        return true;
    }

    override apply(): void {
        if (!this._review) {
            return;
        }

        const review = this._review;
        const ocImg = ExtensionResources.getURL("img/opencritic.png");
        const award = review.verdict ?? "NA";

        let node = document.querySelector<HTMLElement>("#game_area_metascore");
        if (node) {
            node = node.parentNode as HTMLElement;
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
                        <div id="game_area_metalink">${award} - <a href="${review.url}?utm_source=enhanced-steam-itad&utm_medium=average" target="_blank">${L(__readReviews)}</a>
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
                    ${L(__readMoreReviews)}
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
                        <h2>${L(__reviews)}</h2>
                        ${html}
                    </div>`);
            }
        }
         */
    }
}
