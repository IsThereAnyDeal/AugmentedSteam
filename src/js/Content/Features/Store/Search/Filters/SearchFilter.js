
export class SearchFilter {

    constructor(urlParam, feature) {
        this._feature = feature;
        this.urlParam = urlParam;

        this._value = null;
    }

    get active() {
        return false;
    }

    get value() {
        return this._value;
    }

    set value(newVal) {
        if (newVal === this._value) { return; }

        this._value = newVal;
        this._feature.updateURLs();
    }

    setup(params) {
        const rows = document.querySelectorAll(".search_result_row");

        this._addRowMetadata(rows);
        this._setState(params);
        this._apply(rows);
    }

    _addRowMetadata(rows) {
        // left for overrides
    }

    _setState(params) {
        // left for overrides
    }

    _apply(rows) {
        // left for overrides
    }
}

