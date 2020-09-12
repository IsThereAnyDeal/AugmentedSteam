import {ASFeatureManager} from "modules/ASFeatureManager";

export class ASContext {
    constructor(features) {
        this._callbacks = [];
        this.features = features.map(ref => new ref(this));
    }

    applyFeatures() {
        return ASFeatureManager.apply(this.features);
    }

    registerCallback(fn) {
        this._callbacks.push(fn);
    }

    triggerCallbacks(...params) {
        for (let callback of this._callbacks) {
            callback(...params);
        }
    }
}

export const ContextTypes = Object.freeze({
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
    "COMMUNITY_DEFAULT": 14,
    "WORKSHOP": 15,
    "PROFILE_ACTIVITY": 16,
    "GAMES": 17,
    "PROFILE_EDIT": 18,
    "BADGES": 19,
    "GAME_CARD": 20,
    "FRIENDS_THAT_PLAY": 21,
    "FRIENDS": 22,
    "GROUPS": 23,
    "INVENTORY": 24,
    "MARKET_LISTING": 25,
    "MARKET": 26,
    "PROFILE_HOME": 27,
    "GROUP_HOME": 28,
    "GUIDES": 29,
    "COMMUNITY_APP": 30,
    "COMMUNITY_STATS": 31,
    "MY_WORKSHOP": 32,
});
