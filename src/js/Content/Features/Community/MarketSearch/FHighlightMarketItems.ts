import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CMarketSearch from "@Content/Features/Community/MarketSearch/CMarketSearch";
import InventoryApiFacade from "@Content/Facades/InventoryApiFacade";
import SelectorMap from "@Content/SelectorMap";
import {MountTargetError} from "@Core/Errors/Errors";
import HighlightsTagsUtils2, {EHighlightStyle} from "@Content/Modules/Highlights/HighlightsTagsUtils2";

export default class FHighlightMarketItems extends Feature<CMarketSearch> {

    #highlighter: HighlightsTagsUtils2;

    constructor(context: CMarketSearch) {
        super(context);
        this.#highlighter = new HighlightsTagsUtils2();
    }

    override async isEnabled(): Promise<boolean> {
        return Settings.highlight_owned;
    }

    override async apply(): Promise<string|null> {
        const results = document.querySelector(SelectorMap.market.search.container);
        if (!results) {
            throw new MountTargetError();
        }

        this.#highlighter.insertStyles();

        new MutationObserver(() => {
            this.callback();
        }).observe(
            results,
            {
                childList: true,
                subtree: true
            }
        );

        this.callback();
        return null;
    }

    private async callback(): Promise<void> {
        const hashNamesMap: Map<string, HTMLElement> = new Map();

        for (const node of document.querySelectorAll<HTMLAnchorElement>("a")) {
            const url = new URL(node.href);

            if (/\/market\/listings\/753/.test(url.pathname)) {
                const m = url.pathname.match(/\/market\/listings\/753\/(.+)/)!;
                const hashName = decodeURIComponent(m[1]!);
                hashNamesMap.set(hashName, node);
            }
        }

        if (hashNamesMap.size === 0) { return; }

        const hashNames: string[] = Array.from(hashNamesMap.keys());
        const ownedStatus = await InventoryApiFacade.hasItem(hashNames);

        for (const [hashName, node] of hashNamesMap.entries()) {
            if (ownedStatus[hashName]) {
                this.#highlighter.highlight(["owned"], EHighlightStyle.Outline, node.children[0] as HTMLElement);
            }
        }
    }
}
