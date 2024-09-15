import Downloader from "@Core/Downloader";
import {L} from "@Core/Localization/Localization";
import {__export_copyClipboard, __export_download, __export_wishlist,} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import HTML from "@Core/Html/Html";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import Clipboard from "@Content/Modules/Clipboard";
import ExportWishlistForm from "@Content/Features/Store/Wishlist/Components/ExportWishlistForm.svelte";

type WishlistData = Array<[string, {
    name: string,
    type: string,
    release_string: string,
    subs: Array<{
        price: string,
        discount_pct: null|number,
        discount_block: string
    }>
}]>;

enum ExportMethod {
    download,
    copy
}

class WishlistExporter {

    private readonly wishlist: WishlistData;
    private readonly notes: Promise<Map<number, string|null>>;

    constructor(wishlist: WishlistData) {
        this.wishlist = wishlist;

        const userNotes = new UserNotes()
        this.notes = userNotes.get(...wishlist.map(([appidStr, _data]) => Number(appidStr)));
    }

    async toJson(): Promise<string> {
        const json: {version: string, data: any[]} = {
            version: "03",
            data: []
        };

        const notes = await this.notes;

        for (const [appid, data] of this.wishlist) {
            json.data.push({
                gameid: ["steam", `app/${appid}`],
                title: data.name,
                url: `https://store.steampowered.com/app/${appid}/`,
                type: data.type,
                release_date: data.release_string,
                note: notes.get(Number(appid)),
                price: data.subs[0] ? data.subs[0].price : null,
                discount: data.subs[0] ? data.subs[0].discount_pct : 0,
            });
        }

        return JSON.stringify(json, null, 4);
    }

    async toText(format: string): Promise<string> {
        const notes = await this.notes;

        const result = [];
        const parser = new DOMParser();
        for (const [appid, data] of this.wishlist) {
            let price = "N/A";
            let discount = "0%";
            let basePrice = "N/A";

            // if it has a price (steam always picks first sub, see https://github.com/SteamDatabase/SteamTracking/blob/f3f38deef1f1a8c6bf5707013adabde3ed873620/store.steampowered.com/public/javascript/wishlist.js#L292)
            if (data.subs[0]) {
                const block = parser.parseFromString(data.subs[0].discount_block, "text/html");
                price = block.querySelector<HTMLElement>(".discount_final_price")!.innerText;

                // if it is discounted
                if ((data.subs[0].discount_pct ?? 0) > 0) {
                    discount = block.querySelector<HTMLElement>(".discount_pct")!.innerText;
                    basePrice = block.querySelector<HTMLElement>(".discount_original_price")!.innerText;
                } else {
                    basePrice = block.querySelector<HTMLElement>(".discount_final_price")!.innerText;
                }
            }

            result.push(
                format
                    .replace("%appid%", appid)
                    .replace("%id%", `app/${appid}`)
                    .replace("%url%", `https://store.steampowered.com/app/${appid}/`)
                    .replace("%title%", data.name)
                    .replace("%release_date%", data.release_string)
                    .replace("%price%", price)
                    .replace("%discount%", discount)
                    .replace("%base_price%", basePrice)
                    .replace("%type%", data.type)
                    .replace("%note%", notes.get(Number(appid)) ?? "")
            );
        }

        return result.join("\n");
    }
}


export default class FExportWishlist extends Feature<CWishlist> {

    private type: "text"|"json" = "text";
    private format: string = "%title%";

    override apply(): void {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_export_wishlist"><div>${L(__export_wishlist)}</div></div>`);

        document.querySelector("#es_export_wishlist")!.addEventListener("click", () => {
            this.showDialog();
        });
    }

    private async showDialog(): Promise<void> {

        let form: ExportWishlistForm|undefined;

        const observer = new MutationObserver(() => {
            const modal = document.querySelector("#as_export_form");
            if (modal) {
                form = new ExportWishlistForm({
                    target: modal,
                    props: {
                        type: this.type,
                        format: this.format
                    }
                });
                form.$on("setup", () => {
                    this.format = form!.format;
                    this.type = form!.type;
                });
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true
        });

        const response = await SteamFacade.showConfirmDialog(
            L(__export_wishlist),
            `<div id="as_export_form" style="width:580px"></div>`,
            L(__export_download),
            null, // use default "Cancel"
            L(__export_copyClipboard)
        );

        form?.$destroy();

        if (response === "CANCEL") {
            return;
        }

        const method = response === "OK"
            ? ExportMethod.download
            : ExportMethod.copy;

        const appInfo = await SteamFacade.global("g_rgAppInfo");
        const wl: WishlistData = (await SteamFacade.global<{rgVisibleApps: string[]}>("g_Wishlist")).rgVisibleApps.map(
            appid => [appid, appInfo[appid]]
        );
        const wishlist = new WishlistExporter(wl);

        let data = "";
        let filename = "";
        let filetype = "";
        if (this.type === "json") {
            data = await wishlist.toJson();
            filename = "wishlist.json";
            filetype = "application/json";
        } else if (this.type === "text" && this.format) {
            data = await wishlist.toText(this.format);
            filename = "wishlist.txt";
            filetype = "text/plain";
        }

        if (method === ExportMethod.copy) {
            Clipboard.set(data);
        } else if (method === ExportMethod.download) {
            Downloader.download(new Blob([data], {"type": `${filetype};charset=UTF-8`}), filename);
        }
    }
}
