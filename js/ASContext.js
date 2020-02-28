class ASContext {
    constructor(features) {
        this.features = features.map(ref => new ref(this));
    }

    applyFeatures() {
        return ASFeatureManager.apply(this.features);
    }
}
