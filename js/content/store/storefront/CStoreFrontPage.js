class CStoreFrontPage extends CHighlightable {

    constructor() {
        super([
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);

        this.applyFeatures();
    }
}
