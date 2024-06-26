import type DomParserInterface from "@Background/Modules/Dom/DomParserInterface";
import type {TReview} from "@Background/Modules/Community/_types";
import StringUtils from "@Core/Utils/StringUtils";

export default class NativeDomParser implements DomParserInterface {

    private readonly parser: DOMParser;

    constructor() {
        this.parser = new DOMParser();
    }

    private dom(html: string): Document {
        return this.parser.parseFromString(html, "text/html");
    };

    parseCurrencyFromWallet(html: string): string|null {
        return this.dom(html).querySelector<HTMLInputElement>("input[name=currency]")?.value ?? null;
    }

    parseCurrencyFromApp(html: string): string|null {
        return this.dom(html).querySelector("meta[itemprop=priceCurrency][content]")?.getAttribute("content") ?? null;
    }

    parseWorkshopFileSize(html: string): number {
        const details = this.dom(html).querySelector(".detailsStatRight")?.textContent;
        if (!details) {
            return -1;
        }

        const m = details.match(/(\d+(?:[.,]\d+)?) (MB|KB|B)/);
        if (!m) {
            return -2;
        }

        const size = parseFloat(m[1]!.replace(/,/g, ""));
        if (Number.isNaN(size)) {
            return -2;
        }

        const unit = m[2]! as "MB"|"KB"|"B";
        return size*({
            "MB": 1000,
            "KB": 1,
            "B": 0.001
        }[unit]);
    }

    parseReviews(html: string): TReview[] {
        let reviews = [];

        for (const node of this.dom(html).querySelectorAll(".review_box")) {
            const rating = node.querySelector("[src*=thumbsUp]") ? 1 : 0;

            const [helpful = 0, funny = 0] = Array.from(node.querySelector(".header")?.childNodes ?? [])
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => {
                    const text = node.textContent?.match(/(?:\d+,)?\d+/);
                    return text ? Number(text[0].replace(/,/g, "")) : 0;
                });

            const length = node.querySelector(".content")!.textContent!.trim().length;

            // There are only two kinds of visibility, Public: 0; Friends-only: 1
            const visibilityNode = node.querySelector<HTMLInputElement>("input[id^=ReviewVisibility]");
            const visibility = visibilityNode ? Number(visibilityNode.value) : 0;

            const reviewId = visibilityNode
                // Only exists when the requested profile is yours
                ? visibilityNode.id.replace("ReviewVisibility", "")
                // Otherwise you have buttons to vote for and award the review
                : node.querySelector(".control_block > a")!.id.replace("RecommendationVoteUpBtn", "");

            // Total playtime comes first
            const playtimeText = node.querySelector(".hours")!.textContent!.match(/(?:\d+,)?\d+\.\d+/);
            const playtime = playtimeText ? parseFloat(playtimeText[0].replace(/,/g, "")) : 0.0;

            // Count total awards received
            const awards = Array.from(node.querySelectorAll(".review_award"))
                .reduce((acc, node) => {
                    const count = node.classList.contains("more_btn")
                        ? 0
                        : Number(node.querySelector(".review_award_count")!.textContent!.trim());
                    return acc + count;
                }, 0);

            const devResponseNode = node.nextElementSibling?.classList.contains("review_developer_response_container")
                ? node.nextElementSibling.outerHTML
                : "";

            reviews.push({
                default: 0,
                rating,
                helpful,
                funny,
                length,
                visibility,
                playtime,
                awards,
                node: node.outerHTML + devResponseNode,
                id: reviewId
            });
        }

        return reviews;
    }

    parsePurchaseDates(html: string): Array<[string, string]> {
        const replaceRegex = [
            /- Complete Pack/ig,
            /Standard Edition/ig,
            /Steam Store and Retail Key/ig,
            /- Hardware Survey/ig,
            /ComputerGamesRO -/ig,
            /Founder Edition/ig,
            /Retail( Key)?/ig,
            /Complete$/ig,
            /Launch$/ig,
            /Free$/ig,
            /(RoW)/ig,
            /ROW/ig,
            /:/ig,
        ];

        const purchaseDates: Array<[string, string]> = [];

        const dummyPage = this.dom(html);
        const nodes = dummyPage.querySelectorAll<HTMLTableCellElement>("#main_content td.license_date_col");

        for (const node of nodes) {
            const name = node.nextElementSibling;
            if (!name) {
                continue;
            }

            // "Remove" link if present
            name.querySelector("div")?.remove();

            let appName = StringUtils.clearSpecialSymbols(name.textContent!.trim());
            for (const regex of replaceRegex) {
                appName = appName.replace(regex, "");
            }
            appName = appName.trim();
            purchaseDates.push([appName, node.textContent!]);
        }

        return purchaseDates;
    }
}

