import {Background} from "../Background";

class Inventory {

    static getCoupon(appid) {
        return Background.action("coupon", appid);
    }

    static async getAppStatus(appid, options) {

        const opts = {
            "giftsAndPasses": true,
            "coupons": true,
            ...options
        };

        if (!opts.giftsAndPasses && !opts.coupons) { return null; }

        const multiple = Array.isArray(appid);
        const appids = multiple ? appid : [appid];

        try {
            const [giftsAndPasses, coupons] = await Promise.all([
                opts.giftsAndPasses ? Background.action("hasgiftsandpasses", appids) : Promise.resolve(),
                opts.coupons ? Background.action("hascoupon", appids) : Promise.resolve(),
            ]);

            if (!giftsAndPasses && !coupons) { return null; }

            const status = appids.reduce((acc, id) => {
                acc[id] = {
                    "gift": giftsAndPasses ? giftsAndPasses[id].includes("gifts") : false,
                    "guestPass": giftsAndPasses ? giftsAndPasses[id].includes("passes") : false,
                    "coupon": coupons ? coupons[id] : false,
                };
                return acc;
            }, {});

            return multiple ? status : status[appid];
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    static hasInMarketInventory(marketHashes) {
        return Background.action("hasitem", marketHashes);
    }
}

export {Inventory};
