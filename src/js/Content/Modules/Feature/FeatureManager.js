import {Errors} from "../../../Core/Errors/Errors";

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

class FeatureManager {
    static async apply(features) {

        this._promisesMap = new Map();

        this._stats = {
            "completed": 0,
            "failed": 0,
            "dependency": 0,
        };

        while (features.length > 0) {

            const feature = features.pop();
            const promise = this._generateFeatureChain(feature);

            if (promise === null) {
                features.unshift(feature);
            } else {
                this._promisesMap.set(feature.constructor, promise);
            }
        }

        await Promise.allSettled(Array.from(this._promisesMap.values()));

        console.log(
            "Feature loading complete, %i successfully loaded, %i failed to load, %i didn't load due to dependency errors",
            this._stats.completed,
            this._stats.failed,
            this._stats.dependency
        );
    }

    static _generateFeatureChain(feature) {

        let ready = true;
        let promise = Promise.resolve(true);

        if (Array.isArray(feature.constructor.dependencies)) {

            // Ensure that all dependencies have generated a dependency chain for themselves
            for (const dep of feature.constructor.dependencies) {
                if (this._promisesMap.has(dep)) { continue; }

                ready = false;
                break;
            }

            if (ready) {

                // Promise that waits for all dependencies to finish executing
                promise = Promise.all(
                    Array.from(this._promisesMap.entries())
                        .filter(([ftr]) => feature.constructor.dependencies.includes(ftr))
                        .map(([, promise]) => promise)
                );
            }
        }

        if (!ready) { return null; }

        return promise
            .then(previousCheck => { // Check if the dependencies have all their prerequisites fulfilled
                let prev = true;

                if (!feature.constructor.weakDependency) {
                    if (Array.isArray(previousCheck)) {
                        prev = previousCheck.every(res => res);
                    } else {
                        prev = previousCheck;
                    }
                }

                return prev && feature.checkPrerequisites();
            })
            .then(async fulfilled => { // If the feature's prerequisites are fulfilled, apply it
                if (fulfilled) {
                    await feature.apply();
                    ++this._stats.completed;
                }
                return fulfilled;
            })
            .catch(err => {

                const featureName = feature.constructor.name;

                if (err instanceof Errors.FeatureDependencyError) {
                    console.warn(
                        "Not applying feature %s due to an error in the dependency chain (namely %s)",
                        featureName,
                        err.featureName
                    );
                    ++this._stats.dependency;
                    throw err;
                }

                console.group(featureName);
                console.error("Error while applying feature %s", featureName);
                console.error(err);
                console.groupEnd();

                ++this._stats.failed;
                throw new Errors.FeatureDependencyError("Failed to apply", featureName);
            });

    }
}

export {FeatureManager};
