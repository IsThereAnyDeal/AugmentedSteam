class CSearchPage extends ASContext {

    constructor() {
        super([
            FSearchFilters,
        ]);

        this.infiniScrollEnabled = document.querySelector(".search_pagination").style.display === "none";

        this.applyFeatures();
    }
}