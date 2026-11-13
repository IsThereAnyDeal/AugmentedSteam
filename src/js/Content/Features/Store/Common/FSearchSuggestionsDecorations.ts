import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle, type ItemSetup} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import AppId from "@Core/GameId/AppId";
import {MountTargetError} from "@Core/Errors/Errors";
import type Context from "@Content/Modules/Context/Context";
import Settings from "@Options/Data/Settings";
import SelectorMap from "@Content/SelectorMap";
import AugmentedSteamApiFacade from "@Content/Facades/AugmentedSteamApiFacade";
import EarlyAccessQuickSearchFlag from "@Content/Features/Store/Common/EarlyAccess/EarlyAccessQuickSearchFlag.svelte";
import {mount, tick, unmount} from "svelte";
import TimeUtils from "@Core/Utils/TimeUtils";

export default class FSearchSuggestionsDecorations extends Feature<Context> {

    #highlighter: HighlightsTagsUtils2;
    #eaComponents: EarlyAccessQuickSearchFlag[] = [];

    constructor(context: Context) {
        super(context);
        this.#highlighter = new HighlightsTagsUtils2();
    }

    override async isEnabled(): Promise<boolean> {
        return this.#highlighter.isEnabled() || Settings.show_early_access;
    }

    override async apply(): Promise<string|null> {
        /*
        * Artificial delay, because it seems like there's some kind of hydration going on and sometimes
        * the feature is not applied correctly - I think the element we find initially gets replaced?
        * It seemed to be most notable in points shop.
        */
        await TimeUtils.timer(1000);

        const parent = document.querySelector(SelectorMap.quicksearch.container);
        if (!parent) {
            throw new MountTargetError();
        }

        if (this.#highlighter.isEnabled()) {
            this.#highlighter.insertStyles();
        }

        this.#decorate(parent);
        const observer = new MutationObserver(() => this.#decorate(parent));
        observer.observe(parent, {
            childList: true
        });
        return null;
    }

    async #decorate(parent: Element): Promise<void> {
        const nodes = parent.querySelectorAll<HTMLAnchorElement>("a");
        if (nodes.length === 0) {
            return;
        }

        const appids: AppId[] = [];
        const nodeMap: Array<[AppId, HTMLElement]> = [];

        for (const node of nodes) {
            const appidNum = AppId.fromUrl(node.href);
            if (!appidNum) { continue; }

            const appid = new AppId(appidNum);
            appids.push(appid);
            nodeMap.push([appid, node])
        }

        if (appids.length === 0) {
            return;
        }

        const highlights: Map<string, ItemSetup> = this.#highlighter.isEnabled()
            ? await this.#highlighter.query(appids)
            : new Map();

        const ea = Settings.show_early_access
            ? await AugmentedSteamApiFacade.isEarlyAccess(appids.map(appid => appid.number))
            : {};

        for (const [gameid, node] of nodeMap) {
            const setup = highlights.get(gameid.string);

            if (setup?.h) {
                this.#highlighter.highlight(setup.h, EHighlightStyle.BgGradient, node);
            }

            if (setup?.t) {
                const titleNode = node.querySelector<HTMLElement>(SelectorMap.quicksearch.title);
                if (titleNode) {
                    this.#highlighter.tags(setup.t, titleNode);
                }
            }

            if (ea[gameid.number] && !node.dataset.asEa) {
                node.dataset.asEa = "1";
                const target = node.querySelector<HTMLElement>(SelectorMap.quicksearch.capsuleContainer);
                if (target) {
                    target.style.position = "relative";
                    this.#eaComponents.push(mount(EarlyAccessQuickSearchFlag, {target}));
                }
            }
        }

        await tick();
        this.#highlighter.clearDisconnectedTags();
        for (const ea of this.#eaComponents) {
            if (!ea.isConnected) {
                unmount(ea);
            }
        }
    }
}
