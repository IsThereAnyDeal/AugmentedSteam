import GameId from "@Core/GameId/GameId";

// TODO refactor to return instance
export default class SubId extends GameId{

    static fromUrl(url: string): number|null {
        const m = url.match(/(?:store\.steampowered|steamcommunity)\.com\/sub\/(\d+)\/?/);
        return m && m[1] !== undefined
            ? Number(m[1])
            : null;
    }

    static fromElement(element: HTMLElement|null): number|null {
        if (!element) {
            return null;
        }

        const packageid = element.dataset.dsPackageid;
        if (packageid) {
            return Number(packageid);
        }

        const href = element.getAttribute("href");
        if (!href) {
            return null
        }

        return this.fromUrl(href);
    }

    constructor(id: number) {
        super("sub", id);
    }
}
