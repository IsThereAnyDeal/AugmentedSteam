class CSubPage extends CStorePage {
    
    constructor(url) {

        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
        ]);

        this.subid = GameId.getSubid(url);

        this.applyFeatures();
    }
}