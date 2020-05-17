class CFundsPage extends CStoreBase {

    constructor() {
        super([
            FCustomGiftcardAndWallet,
        ]);

        this.applyFeatures();
    }
}