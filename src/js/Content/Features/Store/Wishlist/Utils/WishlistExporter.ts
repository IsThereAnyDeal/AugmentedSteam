import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import Price from "@Content/Modules/Currency/Price";

export type WishlistData = Array<{
    appid: number,
    name: string,
    releaseDate: number|null,
    price: number|null,
    basePrice: number|null,
    discount: number|null,
}>;

export enum ExportMethod {
    download,
    copy
}

export class WishlistExporter {

    private readonly wishlist: WishlistData;
    private readonly notes: Promise<Map<number, string|null>>;

    constructor(wishlist: WishlistData) {
        this.wishlist = wishlist;

        const userNotes = new UserNotes()
        this.notes = userNotes.get(...Object.values(wishlist).map(item => item.appid));
    }

    async toJson(): Promise<string> {
        const json: {version: string, data: any[]} = {
            version: "04",
            data: []
        };

        const notes = await this.notes;

        for (const item of Object.values(this.wishlist)) {
            json.data.push({
                gameid: ["steam", `app/${item.appid}`],
                title: item.name,
                url: `https://store.steampowered.com/app/${item.appid}/`,
                release_date: item.releaseDate
                    ? (new Date(item.releaseDate*1000)).toLocaleDateString()
                    : null,
                note: notes.get(item.appid),
                price: item.price
                    ? (new Price(item.price/100)).toString()
                    : null,
                discount: item.discount ?? 0,
            });
        }

        return JSON.stringify(json, null, 4);
    }

    async toText(format: string): Promise<string> {
        const notes = await this.notes;

        const result = [];
        const parser = new DOMParser();
        for (const item of Object.values(this.wishlist)) {
            const price = item.price
                ? (new Price(item.price/100)).toString()
                : "N/A";
            const basePrice = item.basePrice
                ? (new Price(item.basePrice/100)).toString()
                : "N/A";
            const discount = `${item.discount}%`;

            result.push(
                format
                    .replace("%appid%", String(item.appid))
                    .replace("%id%", `app/${item.appid}`)
                    .replace("%url%", `https://store.steampowered.com/app/${item.appid}/`)
                    .replace("%title%", item.name)
                    .replace("%release_date%", item.releaseDate
                        ? (new Date(item.releaseDate*1000)).toLocaleDateString()
                        : ""
                    )
                    .replace("%price%", price)
                    .replace("%discount%", discount)
                    .replace("%base_price%", basePrice)
                    .replace("%note%", notes.get(item.appid) ?? "")
            );
        }

        return result.join("\n");
    }
}
