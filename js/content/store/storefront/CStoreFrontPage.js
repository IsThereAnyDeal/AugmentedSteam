class CStoreFrontPage extends CStoreBase {

    constructor() {
        super([
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);

        this.applyFeatures();
    }
}
