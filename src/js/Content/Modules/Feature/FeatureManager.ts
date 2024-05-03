import type {Feature} from "./Feature";
import Errors from "@Core/Errors/Errors";

class FeatureManager {

    private static featureMap: Map<Function, Feature>;
    private static promiseMap: Map<Function, Promise<boolean>>;
    private static dependencies: Map<Function, Map<Function, boolean>> = new Map();

    private static stats = {
        "completed": 0,
        "failed": 0,
        "dependency": 0,
    };

    static dependency(dependent: Function, ...dependencies: Array<[Function, boolean]>) {
        this.dependencies.set(dependent, new Map(dependencies));
    }

    static async apply(features: Feature[]) {
        this.promiseMap = new Map();
        this.featureMap = new Map(features.map(feature => [feature.constructor, feature]));

        let promises = features.map(feature => this.getFeaturePromise(feature));
        await Promise.allSettled(promises);

        console.log(
            "Feature loading complete, %i successfully loaded, %i failed to load, %i didn't load due to dependency errors",
            this.stats.completed,
            this.stats.failed,
            this.stats.dependency
        );
    }

    private static getFeaturePromise(feature: Feature): Promise<boolean> {
        const func = feature.constructor;

        let promise = this.promiseMap.get(func);
        if (!promise) {
            promise = this.applyInternal(feature);
            this.promiseMap.set(func, promise);

        }
        return promise;
    }

    private static async applyInternal(feature: Feature): Promise<boolean> {
        const func = feature.constructor;

        const dependencies = this.dependencies.get(func);
        if (dependencies) {
            try {
                let promises = [];
                for (let [dependencyFunc, weak] of dependencies) {
                    promises.push((async () => {
                        const dependency = this.featureMap.get(dependencyFunc);
                        if (!dependency) {
                            throw new Errors.FeatureDependencyError("Dependency feature not found", dependencyFunc.name);
                        }
                        let pass = await this.getFeaturePromise(dependency);
                        return weak || pass;
                    })());
                }

                if (!(await Promise.all(promises)).every(res => res)) {
                    return false;
                }
            } catch(e) {
                console.warn(
                    "Not applying feature %s due to an error in the dependency chain",
                    func.name
                );
                ++this.stats.dependency;
            }
        }

        let pass = Boolean(await feature.checkPrerequisites());
        if (pass) {
            try {
                await feature.apply();
                ++this.stats.completed;
            } catch(e) {
                const featureName = func.name;

                console.group(featureName);
                console.error("Error while applying feature %s", featureName);
                console.error(e);
                console.groupEnd();

                ++this.stats.failed;
                throw new Errors.FeatureDependencyError("Failed to apply", featureName);
            }
        }
        return pass;
    }
}

export {FeatureManager};
