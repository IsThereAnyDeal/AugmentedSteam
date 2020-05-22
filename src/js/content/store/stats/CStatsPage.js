class CStatsPage extends CStoreBase {

    constructor() {
        super([
            FHighlightTopGames,
        ]);

        this.applyFeatures();
    }
}