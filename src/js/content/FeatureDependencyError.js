export class FeatureDependencyError extends Error {
    constructor(msg, featureName) {
        super(msg);
        this.featureName = featureName;
    }
}
