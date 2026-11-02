import Feature from "@Content/Modules/Context/Feature";
import type Context from "@Content/Modules/Context/Context";

export class FeatureDesc {
    #feature: Feature<Context>

    enabled: boolean = false;
    loading: boolean = false;
    failed: boolean = false;
    message: string|null = null;

    constructor(feature: Feature<Context>) {
        this.#feature = feature;
    }

    get name(): string {
        return this.#feature.name;
    }
}

export default class FeatureReport {
    enabled: number = $state(0);
    loading: number = $state(0);
    loaded: number = $state(0);
    failed: number = $state(0);

    features: FeatureDesc[] = $state([]);
}
