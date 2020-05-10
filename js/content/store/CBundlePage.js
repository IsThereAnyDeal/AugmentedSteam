class CBundlePage extends CStorePage {
    constructor(url) {
        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
        ]);

        this.bundleid = GameId.getBundleid(url);

        this.applyFeatures();
    }
}