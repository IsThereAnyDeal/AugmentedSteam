import Feature from "@Content/Modules/Context/Feature";
import type ContextType from "@Content/Modules/Context/ContextType";
import Errors from "@Core/Errors/Errors";
import type Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";

export interface ContextParams {
    language: Language|null,
    user: UserInterface
}

export default class Context {

    public readonly language: Language|null = null;
    public readonly user: UserInterface;
    public readonly type: ContextType;

    private readonly featureMap: Map<Function, Feature<Context>> = new Map();
    private readonly promiseMap: Map<Function, Promise<boolean>> = new Map();
    private readonly dependencies: Map<Function, Map<Function, boolean>> = new Map();

    private stats = {
        completed: 0,
        failed: 0,
        dependency: 0,
    };

    public static async create(_params: ContextParams): Promise<Context|null> {
        // left for overrides, when init requires async things to finish because we can't await constructor
        // TODO we should move all instantiation to init, make constructor private, probably?
        return null;
    }

    constructor(
        params: ContextParams,
        type: ContextType,
        features: (typeof Feature<Context>)[]
    ) {
        this.language = params.language;
        this.user = params.user;
        this.type = type;

        for (let ref of features) {
            // @ts-ignore
            const feature = new ref(this);
            this.featureMap.set(feature.constructor, feature)
        }
    }

    dependency(dependent: Function, ...dependencies: Array<[Function, boolean]>) {
        this.dependencies.set(dependent, new Map(dependencies));
    }

    async applyFeatures(): Promise<void> {

        let promises = [...this.featureMap.values()].map(feature => this.getFeaturePromise(feature));
        await Promise.allSettled(promises);

        console.log(
            "Feature loading complete, %i successfully loaded, %i failed to load, %i didn't load due to dependency errors",
            this.stats.completed,
            this.stats.failed,
            this.stats.dependency
        );
    }

    private getFeaturePromise(feature: Feature<Context>): Promise<boolean> {
        const func = feature.constructor;

        let promise = this.promiseMap.get(func);
        if (!promise) {
            promise = this.applyInternal(feature);
            this.promiseMap.set(func, promise);

        }
        return promise;
    }

    private async applyInternal(feature: Feature<Context>): Promise<boolean> {
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
