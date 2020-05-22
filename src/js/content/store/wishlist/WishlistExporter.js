class WishlistExporter {

    constructor(appInfo, apps) {
        this.appInfo = appInfo;
        this.apps = apps;
        this.notes = SyncedStorage.get("user_notes") || {};
    }

    toJson() {
        let json = {
            version: "03",
            data: []
        };

        for (let [appid, data] of Object.entries(this.appInfo)) {
            json.data.push({
                gameid: ["steam", `app/${appid}`],
                title: data.name,
                url: `https://store.steampowered.com/app/${appid}/`,
                type: data.type,
                release_date: data.release_string,
                note: this.notes[appid] || null,
                price: data.subs[0] ? data.subs[0].price : null,
                discount: data.subs[0] ? data.subs[0].discount_pct : 0,
            });
        }

        return JSON.stringify(json, null, 4);
    }

    toText(format) {
        let result = [];
        let parser = new DOMParser();
        for (let appid of this.apps) {
            let data = this.appInfo[appid];
            let price = "N/A";
            let discount = "0%";
            let base_price = "N/A";

            // if it has a price (steam always picks first sub, see https://github.com/SteamDatabase/SteamTracking/blob/f3f38deef1f1a8c6bf5707013adabde3ed873620/store.steampowered.com/public/javascript/wishlist.js#L292)
            if (data.subs[0]) {
                let block = parser.parseFromString(data.subs[0].discount_block, "text/html");
                price = block.querySelector(".discount_final_price").innerText;

                // if it is discounted
                if (data.subs[0].discount_pct > 0) {
                    discount = block.querySelector(".discount_pct").innerText;
                    base_price = block.querySelector(".discount_original_price").innerText;
                } else {
                    base_price = block.querySelector(".discount_final_price").innerText;
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
                    .replace("%base_price%",  base_price)
                    .replace("%type%", data.type)
                    .replace("%note%", this.notes[appid] || "")
            );
        }

        return result.join("\n");
    }
}

WishlistExporter.method = Object.freeze({"download": Symbol("Download"), "copyToClipboard": Symbol("Copy to clipboard")});
