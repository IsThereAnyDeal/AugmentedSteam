import {Background} from "../Background";

class Inventory {

    static getCoupon(appid) {
        return Background.action("coupon", appid);
    }

    static async getAppStatus(appids, options) {

        function getStatusObject(giftsAndPasses, hasCoupon) {
            return {
                "gift": giftsAndPasses.includes("gifts"),
                "guestPass": giftsAndPasses.includes("passes"),
                "coupon": Boolean(hasCoupon),
            };
        }

        const opts = {"giftsAndPasses": true,
            "coupons": true,
            ...options};

        if (!opts.giftsAndPasses && !opts.coupons) { return null; }

        const multiple = Array.isArray(appids);

        try {
            const [giftsAndPasses, coupons] = await Promise.all([
                opts.giftsAndPasses ? Background.action("hasgiftsandpasses", appids) : Promise.resolve(),
                opts.coupons ? Background.action("hascoupon", appids) : Promise.resolve(),
            ]);

            if (multiple) {
                const results = {};

                for (const id of appids) {
                    results[id] = getStatusObject(giftsAndPasses ? giftsAndPasses[id] : [], coupons ? coupons[id] : false);
                }

                return results;
            }
            return getStatusObject(giftsAndPasses || [], typeof coupons === "undefined" ? false : coupons);
        } catch (err) {
            if (multiple) {
                const results = {};
                for (const id of appids) {
                    results[id] = getStatusObject([], false);
                }
                return results;
            }

            return getStatusObject([], false);
        }
    }

    static hasInMarketInventory(marketHashes) {
        return Background.action("hasitem", marketHashes);
    }
}

export {Inventory};
