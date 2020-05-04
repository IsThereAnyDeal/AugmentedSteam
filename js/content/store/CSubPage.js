class CSubPage extends CStorePage {
    
    constructor(url) {

        super([
            FExtraLinks,
            FDRMWarnings,
        ]);

        this.subid = GameId.getSubid(url);

        this.applyFeatures();
    }
}