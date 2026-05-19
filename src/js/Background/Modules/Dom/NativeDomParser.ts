import type DomParserInterface from "@Background/Modules/Dom/DomParserInterface";
import type {TReview} from "@Background/Modules/Community/_types";
import {DateTime} from "luxon";

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

    parsePurchaseDatesHelp(html: string): number|null {
        const dummyPage = this.dom(html);

        const lineItems = dummyPage.querySelectorAll(".help_purchase_detail_box .LineItemRow");
        for (const lineItem of lineItems) {
            const spans = lineItem.querySelectorAll("span");
            if (spans.length < 2) {
                continue;
            }

            const dateSpan = spans[0];
            const infoSpan = spans[1];
            if (!dateSpan?.textContent || !infoSpan?.textContent) {
                continue;
            }

            const infoText = lineItem.textContent.toLowerCase();
            const match = (infoText.includes("zakoupeno") && !infoText.includes("odesláno")) // "Purchased on Steam" or "Purchased as part of" without "Sent to" (Store purchase including fod/nocost)
                || (infoText.includes("aktivováno jako součást") && !infoText.includes("cd klíč byl zrušen")) // "Activated as part of" without "CD Key was revoked" (key activation)
                || infoText.includes("získáno jako dárek") // "Received as a gift or in trade" or "Received on Steam as part of" (Gift or inventory gift activation)
                || infoText.includes("přidáno do vaší knihovny"); // "Added to your Steam library as part of" (External grant)

            if (!match) {
                continue;
            }

            const dateText = dateSpan.textContent.trim()
            let date = DateTime.fromFormat(dateText, "d. LLL. yyyy -", {locale: "cs"});
            if (date.isValid) {
                return date.toUnixInteger();
            }

            date = DateTime.fromFormat(dateText, "d. LLL. -", {locale: "cs"});
            if (date.isValid) {
                return date.toUnixInteger();
            }
        }

        // revert to purchase box
        const node: HTMLElement|null = dummyPage.querySelector<HTMLElement>(".account_details div:has(.help_lowlight_text):last-of-type");
        if (!node) {
            return null;
        }

        const label: HTMLElement|null = node.querySelector<HTMLElement>(".help_highlight_text");
        const value: HTMLElement|null = node.querySelector<HTMLElement>(".help_lowlight_text");

        if (label?.textContent && value?.textContent) {
            if (/Zakoupeno|Aktivováno/i.test(label.textContent)) {
                let date = DateTime.fromFormat(value.textContent, "d. LLL. yyyy", {locale: "cs"});
                if (date.isValid) {
                    return date.toUnixInteger();
                }

                date = DateTime.fromFormat(value.textContent, "d. LLL.", {locale: "cs"});
                if (date.isValid) {
                    return date.toUnixInteger();
                }
            }
        }

        // no luck, try line items
        return null;
    }
}

