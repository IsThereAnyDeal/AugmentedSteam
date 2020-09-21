export class ASFeature {

    constructor(context) {
        this.context = context;
    }

    checkPrerequisites() {
        return true;
    }

    apply() {
        throw new Error("Stub");
    }

    logError(err, msg, ...args) {
        console.group(this.constructor.name);
        console.error(msg, ...args);
        console.error(err);
        console.groupEnd();
    }
}

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
    "SHARED_FILES": 33,
    "WORKSHOP_BROWSE": 34,
    "EDIT_GUIDE": 35,
    "RECOMMENDED": 36,
    "BOOSTER_CREATOR": 37,
    "TRADE_OFFER": 38,
});

// Polyfill from https://gist.github.com/davidbarral/d0d4da70fa9e6f615595d01f54276e0b#file-promises-js
if (!Promise.allSettled) {
    Promise.allSettled = promises => Promise.all(
        promises.map(promise => promise
            .then(value => ({
                "status": "fulfilled",
                value,
            }))
            .catch(reason => ({
                "status": "rejected",
                reason,
            })))
    );
}

export class ASFeatureManager {
    static async apply(features) {

        const promisesMap = new Map();

        const stats = {
            "completed": 0,
            "failed": 0,
            "dependency": 0,
        };

        while (features.length > 0) {

            // Iterate backwards so that splice doesn't mess up indices
            for (let i = features.length - 1; i >= 0; i--) {
                const feature = features[i];
                let ready = true;
                let promise = Promise.resolve(true);

                if (Array.isArray(feature.constructor.dependencies)) {

                    for (const dep of feature.constructor.dependencies) {
                        if (!promisesMap.has(dep)) {
                            ready = false;
                            break;
                        }
                    }
                    if (ready) {

                        // Promise that waits for all dependencies to finish executing
                        promise = Promise.all(
                            Array.from(promisesMap.entries())
                                .filter(([ftr]) => feature.constructor.dependencies.includes(ftr))
                                .map(([, promise]) => promise)
                        );
                    }
                }

                if (ready) {
                    promisesMap.set(feature.constructor,
                        promise
                            .then(async previousCheck => {
                                let prev = true;

                                if (!feature.constructor.weakDependency) {
                                    if (Array.isArray(previousCheck)) {
                                        prev = previousCheck.every(res => res);
                                    } else {
                                        prev = previousCheck;
                                    }
                                }

                                return prev && await feature.checkPrerequisites();
                            })
                            .then(async fulfilled => {
                                if (fulfilled) {
                                    await feature.apply();
                                    ++stats.completed;
                                }
                                return fulfilled;
                            })
                            .catch(err => {

                                const featureName = feature.constructor.name;

                                if (err instanceof FeatureDependencyError) {
                                    console.warn("Not applying feature %s due to an error in the dependency chain (namely %s)", featureName, err.featureName);
                                    ++stats.dependency;
                                    throw err;
                                }

                                console.group(featureName);
                                console.error("Error while applying feature %s", featureName);
                                console.error(err);
                                console.groupEnd();

                                ++stats.failed;
                                throw new FeatureDependencyError("Failed to apply", featureName);
                            }));
                    features.splice(i, 1);
                }
            }
        }

        await Promise.allSettled(Array.from(promisesMap.values()));

        console.log("Feature loading complete, %i successfully loaded, %i failed to load, %i didn't load due to dependency errors", stats.completed, stats.failed, stats.dependency);
    }
}

export class CallbackFeature extends ASFeature {

    constructor(context, initialCall = true, setupFn) {

        super(context);

        this.initialCall = initialCall;

        if (typeof setupFn === "function") {
            setupFn();
        }
    }

    apply() {
        this.context.registerCallback((...params) => { this.callback(...params); });

        if (this.initialCall) {
            this.callback();
        }
    }
}

export class FeatureDependencyError extends Error {
    constructor(msg, featureName) {
        super(msg);
        this.featureName = featureName;
    }
}
