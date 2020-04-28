class CStorePage extends ASContext {
    constructor(features) {
        features.push(
            FITADPrices,
        );

        super(features);
    }

    getAllSubids() {
        let result = [];
        for (let node of document.querySelectorAll("input[name=subid]")) {
            result.push(node.value);
        }
        return result;
    }
}
