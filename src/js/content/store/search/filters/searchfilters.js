export class SearchFilter {

    constructor(urlParam, feature) {
        this._feature = feature;
        this.urlParam = urlParam;

        this._value = null;
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

export class SimpleSearchFilter extends SearchFilter {

    constructor(urlParam, feature, localization, id) {
        super(urlParam, feature);

        this._localization = localization;
        this._id = id;
    }

    getHTML() {
        return `<div class="tab_filter_control_row" data-param="augmented_steam" data-value="${this._id}" data-loc="${this._localization}" data-clientside="1">
                    <span class="tab_filter_control tab_filter_control_include" data-param="augmented_steam" data-value="${this._id}" data-loc="${this._localization}" data-clientside="1">
                        <span>
                            <span class="tab_filter_control_checkbox"></span>
                            <span class="tab_filter_control_label">${this._localization}</span>
                            <span class="tab_filter_control_count" style="display: none;"></span>
                        </span>
                    </span>
                </div>`;
    }

    setup(params) {
        this._elem = document.querySelector(`span[data-param="augmented_steam"][data-value="${this._id}"]`);

        this._elem.addEventListener("click", () => { this._onClick(); });

        super.setup(params);
    }

    setState(params) {

        this.active =
            params.has(this.urlParam)
            && params.get(this.urlParam).split(",").includes(this._id);
    }

    _onClick() {

        let filter = this._elem;

        /**
         * https://github.com/SteamDatabase/SteamTracking/blob/0705b45875511f8dd802002622ad3d7abcabfc6e/store.steampowered.com/public/javascript/searchpage.js#L859
         * OnClickClientFilter
         */
        let savedOffset = filter.getBoundingClientRect().top;
        
        this.active = filter.classList.toggle("checked");

        let fixScrollOffset = document.scrollTop - savedOffset + filter.getBoundingClientRect().top;
        document.scrollTop = fixScrollOffset;
    }

    set active(active) {
        let filter = this._elem;
        this._active = active;

        /**
         * https://github.com/SteamDatabase/SteamTracking/blob/0705b45875511f8dd802002622ad3d7abcabfc6e/store.steampowered.com/public/javascript/searchpage.js#L815
         * EnableClientSideFilters
         */
        this._feature.results.classList.toggle(this._id, active);
        filter.classList.toggle("checked", active);
        filter.parentElement.classList.toggle("checked", active);

        this.value = this._active ? this._id : null;
    }

    get active() {
        return this._active;
    }
}
