import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default abstract class SearchFilter {

    protected readonly _feature: FSearchFilters;
    public readonly urlParam: string;
    protected _value: string|null = null;

    protected constructor(urlParam: string, feature: FSearchFilters) {
        this._feature = feature;
        this.urlParam = urlParam;

        this._value = null;
    }

    get active(): boolean {
        return false;
    }

    get value(): string|null {
        return this._value;
    }

    set value(newVal: string|null) {
        if (newVal === this._value) { return; }

        this._value = newVal;
        this._feature.updateURLs();
    }

    setup(params: URLSearchParams): void {
        const rows = document.querySelectorAll<HTMLElement>(".search_result_row");

        this._addRowMetadata(rows);
        this._setState(params);
        this._apply(rows);
    }

    _addRowMetadata(_rows: NodeListOf<HTMLElement>): void {
        // left for overrides
    }

    _setState(_params: URLSearchParams): void {
        // left for overrides
    }

    _apply(_rows: NodeListOf<HTMLElement>): void {
        // left for overrides
    }

    abstract getHTML(): void;
}

