import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import AppId from "@Core/GameId/AppId";
import type CStoreFront from "@Content/Features/Store/Storefront/CStoreFront";

export default class FStorefrontHighlights extends Feature<CStoreFront> {

    #highlighter: HighlightsTagsUtils2;

    constructor(context: CStoreFront) {
        super(context);
        this.#highlighter = new HighlightsTagsUtils2();
    }

    override async isEnabled(): Promise<boolean> {
        return this.#highlighter.isEnabled();
    }

    override async apply(): Promise<string|null> {
        this.#highlighter.insertStyles();

        this.#higlightTabs();

        this.context.moreContentEvent.subscribe(() => this.#highlightMoreContent());
        return null;
    }

    #getAppids(nodes: NodeListOf<HTMLElement>): AppId[] {
        const appids: Set<AppId> = new Set();
        for (const node of nodes) {
            const appid = new AppId(Number(node.dataset.dsAppid));
            appids.add(appid);
        }
        return [...appids];
    }

    async #higlightTabs(): Promise<void> {
        const nodes = document.querySelectorAll<HTMLElement>("#home_tabs_row .tab_row_item[data-ds-appid]");

        const appids = this.#getAppids(nodes);
        if (appids.length === 0) {
            return;
        }

        const setup = await this.#highlighter.query(appids);
        for (const row of nodes) {
            const appid = new AppId(Number(row.dataset.dsAppid));
            const item = setup.get(appid.string);

            if (item?.h) {
                this.#highlighter.highlight(item.h, EHighlightStyle.BgGradient, row);
            }

            if (item?.t) {
                const titleNode = row.querySelector(".tab_item_title");
                if (titleNode) {
                    this.#highlighter.tags(item.t, titleNode);
                }
            }
        }
    }

    async #highlightMoreContent(): Promise<void> {
        const nodes = document.querySelectorAll<HTMLElement>(".home_content.single .gamelink[data-ds-appid]");

        const appids = this.#getAppids(nodes);
        if (appids.length === 0) {
            return;
        }

        const setup = await this.#highlighter.query(appids);
        for (const row of nodes) {
            const appid = new AppId(Number(row.dataset.dsAppid));
            const item = setup.get(appid.string);

            if (item?.h) {
                const parent = row.closest<HTMLElement>(".home_content.single")!;
                this.#highlighter.highlight(item.h, EHighlightStyle.BgGradient, parent);
            }

            if (item?.t) {
                const titleNode = row.closest<HTMLElement>(".home_content.single")!.querySelector("h2");
                if (titleNode) {
                    this.#highlighter.tags(item.t, titleNode);
                }
            }
        }
    }
}
