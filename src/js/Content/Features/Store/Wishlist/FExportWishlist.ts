import Downloader from "@Core/Downloader";
import {L} from "@Core/Localization/Localization";
import {
    __export_copyClipboard,
    __export_download,
    __export_format,
    __export_text,
    __export_type,
    __export_wishlist,
} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import HTML from "@Core/Html/Html";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import UserNotes from "@Content/Features/Store/Common/UserNotes";
import Clipboard from "@Content/Modules/Clipboard";

type Wishlist = Array<[string, {
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
    copyToClipboard
}

class WishlistExporter {

    private readonly wishlist: Wishlist;
    private readonly notes: Promise<Map<number, string|null>>;

    constructor(wishlist: Wishlist) {
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

    override apply(): void {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_export_wishlist"><div>${L(__export_wishlist)}</div></div>`);

        document.querySelector("#es_export_wishlist")!.addEventListener("click", async() => {
            const appInfo = await SteamFacade.global("g_rgAppInfo");
            const wl: Wishlist = (await SteamFacade.global<{rgVisibleApps: string[]}>("g_Wishlist")).rgVisibleApps.map(
                appid => [appid, appInfo[appid]]
            );
            this._showDialog(wl);
        });
    }

    /*
     * Using Valve's CModal API here is very hard, since, when trying to copy data to the clipboard, it has to originate from
     * a short-lived event handler for a user action.
     * Since we'd use our Messenger class to pass information in between these two contexts, we would "outrange" this specific event
     * handler, resulting in a denial of access to the clipboard function.
     * This could be circumvented by adding the appropriate permissions, but doing so would prompt users to explicitly accept the
     * changed permissions on an update.
     *
     * If we don't use the Messenger, we'd have to move the whole handler part (including WishlistExporter) to
     * the page context side.
     *
     * Final solution is to query the action buttons of the dialog and adding some extra click handlers on the content script side.
     */
    _showDialog(wl: Array<[string, any]>): void {

        async function exportWishlist(method: ExportMethod): Promise<void> {
            const type = document.querySelector<HTMLInputElement>("input[name='es_wexport_type']:checked")!.value;
            const format = document.querySelector<HTMLInputElement>("#es-wexport-format")!.value;

            const wishlist = new WishlistExporter(wl);

            let result = "";
            let filename = "";
            let filetype = "";
            if (type === "json") {
                result = await wishlist.toJson();
                filename = "wishlist.json";
                filetype = "application/json";
            } else if (type === "text" && format) {
                result = await wishlist.toText(format);
                filename = "wishlist.txt";
                filetype = "text/plain";
            }

            if (method === ExportMethod.copyToClipboard) {
                Clipboard.set(result);
            } else if (method === ExportMethod.download) {
                Downloader.download(new Blob([result], {"type": `${filetype};charset=UTF-8`}), filename);
            }
        }

        SteamFacade.showConfirmDialog(
            L(__export_wishlist),
            `<div id="es_export_form">
                    <div class="es-wexport">
                        <h2>${L(__export_type)}</h2>
                        <div>
                            <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="text" checked> ${L(__export_text)}</label>
                            <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="json"> JSON</label>
                        </div>
                    </div>
                    <div class="es-wexport es-wexport__format">
                        <h2>${L(__export_format)}</h2>
                        <div>
                            <input type="text" id="es-wexport-format" class="es-wexport__input" value="%title%"><br>
                            <div class="es-wexport__symbols">%title%, %id%, %appid%, %url%, %release_date%, %price%, %discount%, %base_price%, %type%, %note%</div>
                        </div>
                    </div>
                </div>`,
            L(__export_download),
            null, // use default "Cancel"
            L(__export_copyClipboard)
        );

        const [dlBtn, copyBtn] = document.querySelectorAll(".newmodal_buttons > .btn_medium");

        // Update button to new style, remove when not needed
        copyBtn!.classList.replace("btn_darkblue_white_innerfade", "btn_blue_steamui");

        // Capture this s.t. the CModal doesn't get destroyed before we can grab this information
        dlBtn!.addEventListener("click", () => exportWishlist(ExportMethod.download), true);
        copyBtn!.addEventListener("click", () => exportWishlist(ExportMethod.copyToClipboard), true);

        const format = document.querySelector<HTMLElement>(".es-wexport__format");
        for (const el of document.getElementsByName("es_wexport_type")) {
            el.addEventListener("click", e => {
                const target = e.target as HTMLInputElement;
                format!.classList.toggle("es-grayout", target.value === "json");
            });
        }
    }
}
