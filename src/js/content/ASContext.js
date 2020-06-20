import { ASFeatureManager } from "./ASFeatureManager.js";

export class ASContext {
    constructor(features) {
        this.features = features.map(ref => new ref(this));
    }

    applyFeatures() {
        return ASFeatureManager.apply(this.features);
    }
}

export let ContextTypes = Object.freeze({
    "ACCOUNT": 1,
    "APP": 2,
    "BUNDLE": 3,
    "STORE_DEFAULT": 4,
    "FUNDS": 5,
    "REGISTER_KEY": 6,
    "SALE": 7,
    "SEARCH": 8,
    "STATS": 9,
    "STORE_FRONT": 10,
    "SUB": 11,
    "WISHLIST": 12,
    "AGECHECK": 13,
});
