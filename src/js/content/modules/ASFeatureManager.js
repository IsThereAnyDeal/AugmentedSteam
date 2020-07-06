import {FeatureDependencyError} from "modules/FeatureDependencyError";

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
