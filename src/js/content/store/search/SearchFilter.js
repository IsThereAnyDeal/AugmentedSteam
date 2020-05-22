class SearchFilter {

    urlParam;

    _value = null;
    _feature;

    constructor(urlParam, feature) {
        this._feature = feature;
        this.urlParam = urlParam;
    }

    get active() { return false; }

    set value(newVal) {
        if (newVal === this._value) { return; }

        this._value = newVal;
        this._feature.updateURLs();
    }

    get value() { return this._value; }

    getHTML() {}

    setup(params) {
        let rows = document.querySelectorAll(".search_result_row");

        this.addRowMetadata(rows);
        this.setState(params);
        this.apply(rows);
    }

    setState(params) {}

    addRowMetadata(rows) {}

    apply(rows) {}
}
