import type {TReview} from "@Background/Modules/Community/_types";

export default interface DomParserInterface {
    parseCurrencyFromWallet(html: string): string|null|Promise<string | null>;
    parseCurrencyFromApp(html: string): string|null|Promise<string|null>;
    parseWorkshopFileSize(html: string): number|Promise<number>;
    parseReviews(html: string): TReview[]|Promise<TReview[]>;

    parsePurchaseDates(html: string): Array<[string, string]>|Promise<Array<[string, string]>>;
}
