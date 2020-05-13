class CSearchPage extends ASContext {

    constructor() {
        super([
            FSearchFilters,
            FHighlightsTags,
        ]);

        this.infiniScrollEnabled = document.querySelector(".search_pagination").style.display === "none";

        this.applyFeatures();
    }
}