import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";
import SearchFilter from "@Content/Features/Store/Search/Filters/SearchFilter";

export default abstract class SimpleSearchFilter extends SearchFilter {

    private readonly _localization: string;
    private readonly _id: string;

    private _elem: HTMLElement|null = null;
    private _active: boolean = false;

    protected constructor(urlParam: string, feature: FSearchFilters, localization: string, id: string) {
        super(urlParam, feature);

        this._localization = localization;
        this._id = id;
    }

    getHTML(): string {
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

    override setup(params: URLSearchParams): void {
        this._elem = document.querySelector(`span[data-param="augmented_steam"][data-value="${this._id}"]`);
        this._elem?.addEventListener("click", () => this._onClick());
        super.setup(params);
    }

    override _setState(params: URLSearchParams): void {

        this.active
            = params.has(this.urlParam)
            && (params.get(this.urlParam)?.split(",").includes(this._id) ?? false);
    }

    _onClick(): void {

        const filter = this._elem;
        if (!filter) { return; }

        /*
         * https://github.com/SteamDatabase/SteamTracking/blob/0705b45875511f8dd802002622ad3d7abcabfc6e/store.steampowered.com/public/javascript/searchpage.js#L859
         * OnClickClientFilter
         */
        const savedOffset = filter.getBoundingClientRect().top;

        this.active = filter.classList.toggle("checked");

        document.body.scrollTop = document.body.scrollTop - savedOffset + filter.getBoundingClientRect().top;
    }

    override get active(): boolean {
        return this._active;
    }

    override set active(active: boolean) {
        const filter = this._elem;
        if (!filter) {
            return;
        }

        this._active = active;

        /*
         * https://github.com/SteamDatabase/SteamTracking/blob/0705b45875511f8dd802002622ad3d7abcabfc6e/store.steampowered.com/public/javascript/searchpage.js#L815
         * EnableClientSideFilters
         */
        this._feature.results?.classList.toggle(this._id, active);
        filter.classList.toggle("checked", active);
        filter.parentElement!.classList.toggle("checked", active);

        this.value = this._active ? this._id : null;
    }
}
