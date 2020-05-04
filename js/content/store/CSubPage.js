class CSubPage extends CStorePage {
    
    constructor(url) {

        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
        ]);

        this.subid = GameId.getSubid(url);

        this.applyFeatures();
    }
}