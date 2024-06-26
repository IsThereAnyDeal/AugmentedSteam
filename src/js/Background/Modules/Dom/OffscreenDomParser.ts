import browser from "webextension-polyfill";
import type DomParserInterface from "@Background/Modules/Dom/DomParserInterface";
import type {TReview} from "@Background/Modules/Community/_types";

const OffscreenDocument = "html/offscreen_domparser.html";

export default class OffscreenDomParser implements DomParserInterface {

    private async ensureDocument(): Promise<void> {
        // @ts-expect-error
        const matchedClients = await clients.matchAll();
        for (const client of matchedClients) {
            if (client.url.endsWith(OffscreenDocument)) {
                return;
            }
        }

        // @ts-expect-error
        return chrome.offscreen.createDocument({
            url: browser.runtime.getURL(OffscreenDocument),
            reasons: ["DOM_PARSER"],
            justification: "Parsing data from DOM",
        });
    }

    private closeDocument(): void {
        // @ts-expect-error
        chrome.offscreen.closeDocument()
    }

    private async send<T>(op: string, html: string): Promise<T> {
        await this.ensureDocument();
        const response = await browser.runtime.sendMessage({
            domparser: {op, html}
        });
        this.closeDocument();
        return response;
    }

    parseCurrencyFromWallet(html: string): Promise<string | null> {
        return this.send("currencyFromWallet", html);
    }

    parseCurrencyFromApp(html: string): Promise<string | null> {
        return this.send("currencyFromApp", html);
    }

    parseWorkshopFileSize(html: string): number | Promise<number> {
        return this.send("workshopFileSize", html);
    }

    parseReviews(html: string): TReview[] | Promise<TReview[]> {
        return this.send("reviews", html);
    }

    parsePurchaseDates(html: string): Promise<Array<[string, string]>> {
        return this.send("purchaseDates", html);
    }
}

