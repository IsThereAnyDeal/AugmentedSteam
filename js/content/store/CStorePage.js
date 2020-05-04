class CStorePage extends ASContext {

    constructor(features) {
        features.push(
            FHighlightsTags,
        );

        super(features);
    }

    getAllSubids() {
        let result = [];
        for (let node of document.querySelectorAll("input[name=subid]")) {
            if (node.value) {
                result.push(node.value);
            }
        }
        return result;
    }
}
