import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Localization} from "../../Core/Localization/Localization";
import {HTML} from "../../Core/Html/Html";
import {Background} from "./Background";
import {User} from "./User";
import {Price} from "./Price";
import {CurrencyManager} from "./CurrencyManager";

class Prices {

    constructor() {
        this.appids = [];
        this.subids = [];
        this.bundleids = [];

        this.priceCallback = null;
        this.bundleCallback = null;

        this._bundles = [];
    }

    _getApiParams() {
        const apiParams = {};

        if (!SyncedStorage.get("showallstores") && SyncedStorage.get("stores").length > 0) {
            apiParams.stores = SyncedStorage.get("stores").join(",");
        }

        const cc = User.storeCountry;
        if (cc) {
            apiParams.cc = cc;
        }

        apiParams.appids = this.appids.join(",");
        apiParams.subids = this.subids.join(",");
        apiParams.bundleids = this.bundleids.join(",");

        if (SyncedStorage.get("showlowestpricecoupon")) {
            apiParams.coupon = true;
        }

        if (!apiParams.appids && !apiParams.subids && !apiParams.bundleids) { return null; }

        return apiParams;
    }

    /**
     * @param priceData
     * @param {Price} price
     * @param {string} pricingStr
     */
    _getPricingStrings(priceData, price, pricingStr) {
        let prices = price.toString();
        if (CurrencyManager.customCurrency !== CurrencyManager.storeCurrency) {
            const priceAlt = price.inCurrency(CurrencyManager.storeCurrency);
            prices += ` (${priceAlt.toString()})`;
        }
        const pricesStr = `<span class="itad-pricing__price">${prices}</span>`;

        let cutStr = "";
        if (priceData.cut > 0) {
            cutStr = `<span class="itad-pricing__cut">-${priceData.cut}%</span> `;
        }

        const storeStr = pricingStr.store.replace("__store__", priceData.store);
        return [pricesStr, cutStr, storeStr];
    }

    _processPrices(gameid, meta, info) {
        if (!this.priceCallback) { return; }

        const [type, id] = gameid.split("/");

        const node = document.createElement("div");
        node.classList.add("itad-pricing");
        node.id = `es_price_${id}`;

        const pricingStr = Localization.str.pricing;

        let hasData = false;
        const priceData = info.price;
        const lowestData = info.lowest;
        const bundledCount = info.bundles.count;
        const urlData = info.urls;

        // Current best
        if (priceData) {
            hasData = true;

            let lowest;
            let voucherStr = "";
            if (SyncedStorage.get("showlowestpricecoupon") && priceData.price_voucher) {
                lowest = new Price(priceData.price_voucher, meta.currency);

                const voucher = HTML.escape(priceData.voucher);
                voucherStr = `${pricingStr.with_voucher.replace(
                    "__voucher__",
                    `<span class="itad-pricing__voucher">${voucher}</span>`
                )} `;
            } else {
                lowest = new Price(priceData.price, meta.currency);
            }

            lowest = lowest.inCurrency(CurrencyManager.customCurrency);
            const [pricesStr, cutStr, storeStr] = this._getPricingStrings(priceData, lowest, pricingStr);

            let drmStr = "";
            if (priceData.drm.length > 0 && priceData.store !== "Steam") {
                drmStr = `<span class="itad-pricing__drm">(${priceData.drm[0]})</span>`;
            }

            const infoUrl = HTML.escape(urlData.info);
            const storeUrl = HTML.escape(priceData.url.toString());

            HTML.beforeEnd(node, `<a href="${infoUrl}" target="_blank">${pricingStr.lowest_price}</a>`);
            HTML.beforeEnd(node, pricesStr);
            HTML.beforeEnd(
                node,
                `<a href="${storeUrl}" class="itad-pricing__main" target="_blank">${cutStr}${voucherStr}${storeStr} ${drmStr}</a>`
            );
        }

        // Historical low
        if (lowestData) {
            hasData = true;

            const historical = new Price(lowestData.price, meta.currency).inCurrency(CurrencyManager.customCurrency);
            const [pricesStr, cutStr, storeStr] = this._getPricingStrings(lowestData, historical, pricingStr);
            const dateStr = new Date(lowestData.recorded * 1000).toLocaleDateString();

            const infoUrl = HTML.escape(urlData.history);

            HTML.beforeEnd(node, `<a href="${infoUrl}" target="_blank">${pricingStr.historical_low}</a>`);
            HTML.beforeEnd(node, pricesStr);
            HTML.beforeEnd(node, `<div class="itad-pricing__main">${cutStr}${storeStr} ${dateStr}</div>`);
        }

        // times bundled
        if (bundledCount > 0) {
            hasData = true;

            const bundledUrl = HTML.escape(urlData.bundles || urlData.bundle_history);
            const bundledStr = pricingStr.bundle_count.replace("__count__", bundledCount);

            HTML.beforeEnd(node, `<a href="${bundledUrl}" target="_blank">${pricingStr.bundled}</a>`);
            HTML.beforeEnd(node, `<div class="itad-pricing__bundled">${bundledStr}</div>`);
        }

        if (hasData) {
            this.priceCallback(type, id, node);
        }
    }

    _processBundles(meta, info) {
        if (!this.bundleCallback) { return; }

        let purchase = "";

        for (const bundle of info.bundles.live) {
            const tiers = bundle.tiers;

            let endDate;
            if (bundle.expiry) {
                endDate = new Date(bundle.expiry * 1000);
            }

            const currentDate = new Date().getTime();
            if (endDate && currentDate > endDate) { continue; }

            const bundleNormalized = JSON.stringify({
                "page":  bundle.page || "",
                "title": bundle.title || "",
                "url":   bundle.url || "",
                "tiers": (() => {
                    const sorted = [];
                    for (const t of Object.keys(tiers)) {
                        sorted.push((tiers[t].games || []).sort());
                    }
                    return sorted;
                })(),
            });

            if (this._bundles.indexOf(bundleNormalized) >= 0) { continue; }
            this._bundles.push(bundleNormalized);

            if (bundle.page) {
                const bundlePage = Localization.str.buy_package.replace("__package__", `${bundle.page} ${bundle.title}`);
                purchase
                    += `<div class="game_area_purchase_game">
                            <div class="game_area_purchase_platform"></div>
                            <h1>${bundlePage}</h1>`;
            } else {
                const bundleTitle = Localization.str.buy_package.replace("__package__", bundle.title);
                purchase
                    += `<div class="game_area_purchase_game_wrapper">
                            <div class="game_area_purchase_game"></div>
                            <div class="game_area_purchase_platform"></div>
                            <h1>${bundleTitle}</h1>`;
            }

            if (endDate) {
                purchase += `<p class="game_purchase_discount_countdown">${Localization.str.bundle.offer_ends} ${endDate}</p>`;
            }

            purchase += '<p class="package_contents">';

            let bundlePrice;
            const appName = document.querySelector(".apphub_AppName").textContent;

            for (let i = 0; i < tiers.length; ++i) {
                const tierNum = i + 1;
                const tier = tiers[i];

                purchase += "<b>";
                if (tiers.length > 1) {
                    const tierName = tier.note || Localization.str.bundle.tier.replace("__num__", tierNum);
                    const tierPrice = (new Price(tier.price, meta.currency).inCurrency(CurrencyManager.customCurrency))
                        .toString();

                    purchase += Localization.str.bundle.tier_includes.replace("__tier__", tierName).replace("__price__", tierPrice)
                        .replace("__num__", tier.games.length);
                } else {
                    purchase += Localization.str.bundle.includes.replace("__num__", tier.games.length);
                }
                purchase += ":</b> ";

                const gameList = tier.games.join(", ");
                if (gameList.includes(appName)) {
                    purchase += gameList.replace(appName, `<u>${appName}</u>`);
                    bundlePrice = tier.price;
                } else {
                    purchase += gameList;
                }

                purchase += "<br>";
            }

            purchase += "</p>";
            purchase += `<div class="game_purchase_action">
                            <div class="game_purchase_action_bg">
                                <div class="btn_addtocart btn_packageinfo">
                                    <a class="btn_blue_steamui btn_medium" href="${bundle.details}" target="_blank">
                                        <span>${Localization.str.bundle.info}</span>
                                    </a>
                                </div>
                            </div>
                            <div class="game_purchase_action_bg">`;

            if (bundlePrice && bundlePrice > 0) {
                bundlePrice = (new Price(bundlePrice, meta.currency).inCurrency(CurrencyManager.customCurrency))
                    .toString();
                purchase += `<div class="game_purchase_price price" itemprop="price">${bundlePrice}</div>`;
            }

            purchase += `<div class="btn_addtocart">
                            <a class="btn_green_steamui btn_medium" href="${bundle.url}" target="_blank">
                                <span>${Localization.str.buy}</span>
                            </a>
                        </div></div></div></div>`;
        }

        if (purchase) {
            this.bundleCallback(purchase);
        }
    }

    load() {
        const apiParams = this._getApiParams();
        if (!apiParams) { return; }

        Background.action("prices", apiParams).then(response => {
            const meta = response[".meta"];

            for (const [gameid, info] of Object.entries(response.data)) {
                this._processPrices(gameid, meta, info);
                this._processBundles(meta, info);
            }
        });
    }
}

export {Prices};
