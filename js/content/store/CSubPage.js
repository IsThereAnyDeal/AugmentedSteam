class CSubPage extends CStorePage {
    
    constructor(url) {

        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.subid = GameId.getSubid(url);

        this.applyFeatures();
    }
}