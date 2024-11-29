import GameId from "@Core/GameId/GameId";

// TODO refactor to return instance
export default class AppId extends GameId {

    static fromUrl(url: string) {
        const m = url.match(/(?:store\.steampowered|steamcommunity)\.com\/(?:app|games|market\/listings)\/(\d+)\/?/);
        return m && m[1] !== undefined
            ? Number(m[1])
            : null;
    }

    static fromCDNUrl(url: string): number|null {
        const CDNRegex_1 = /(?:cdn\.(?:(?:akamai|cloudflare|fastly)\.)?steamstatic\.com\/steam|steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//;
        const CDNRegex_2 = /shared\.(?:(?:akamai|cloudflare|fastly)\.)?steamstatic\.com\/store_item_assets\/steam\/apps\/(\d+)\//;
        const m = url.match(CDNRegex_1) ?? url.match(CDNRegex_2);
        return m && m[1] !== undefined
            ? Number(m[1])
            : null;
    }

    static fromGameCardUrl(url: string): number|null {
        const m = url.match(/\/gamecards\/(\d+)/);
        return m && m[1] !== undefined
            ? Number(m[1])
            : null;
    }

    static fromElement(element: HTMLElement|null): number|null {
        if (!element) {
            return null;
        }

        const appid = element.dataset.dsAppid;
        if (appid) {
            return Number(appid);
        }

        const href = element.getAttribute("href");
        if (!href) {
            return null;
        }

        return this.fromUrl(href);
    }

    static fromImageElement(element: HTMLImageElement|null): number|null {
        if (!element) {
            return null;
        }

        const src = element.getAttribute("src");
        if (src) {
            return this.fromCDNUrl(src);
        } else if (element.dataset.imageUrl) {
            return this.fromCDNUrl(element.dataset.imageUrl);
        }
        return null;
    }

    static fromText(text: string): number[] {
        const regex = /(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g;
        const result: number[] = [];
        let m;
        while ((m = regex.exec(text)) !== null) {
            result.push(Number(m[1]));
        }
        return result;
    }

    constructor(id: number) {
        super("app", id);
    }
}
