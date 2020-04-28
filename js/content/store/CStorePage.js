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

    isDlc() {
        return Boolean(document.querySelector("div.game_area_dlc_bubble"));
    }
}
