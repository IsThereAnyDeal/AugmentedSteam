/*
 * The market only knows the English card names, while the badge page shows them in the
 * language of the Community (#2393). The localized page does not carry the English names,
 * so the same page is fetched once with `l=english` and the cards are matched by position.
 */
const CardSelector = ".badge_card_set_card";
const CardNameSelector = ".badge_card_set_text";

export function readCardName(node: Element): string {
    return node
        .querySelector<HTMLElement>(CardNameSelector)!.textContent!
        .replace(/&amp;/g, "&")
        .replace(/\(\d+\)/g, "")
        .trim();
}

export function readCardNames(root: ParentNode): string[] {
    return [...root.querySelectorAll(CardSelector)].map(readCardName);
}

export function englishBadgeUrl(href: string): string {
    const url = new URL(href);
    url.searchParams.set("l", "english");
    return url.toString();
}

/**
 * Both pages list the cards in the same order, so the names line up by index.
 * A different count means the pages do not match and the visible names are kept.
 */
export function marketCardNames(visible: string[], english: string[]): string[] {
    return english.length === visible.length ? english : visible;
}
