import Feature from "@Content/Modules/Context/Feature";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import HighlightsTagsUtils2, {
    EHighlightStyle,
    type HighlightMap
} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import type CApp from "@Content/Features/Store/App/CApp";
import GameId from "@Core/GameId/GameId";
import AppId from "@Core/GameId/AppId";
import {tick} from "svelte";

export default class FHighlightsTags extends Feature<CApp> {

    readonly #highlighter: HighlightsTagsUtils2;

    constructor(context: CApp) {
        super(context);
        this.#highlighter = new HighlightsTagsUtils2()
    }

    override async checkPrerequisites(): Promise<boolean> {
        return this.#highlighter.isEnabled();
    }

    override async apply(): Promise<void> {
        const ids: GameId[] = [];

        const appid = new AppId(this.context.appid);
        ids.push(appid);

        const dlcNodeMap: Array<[GameId, HTMLElement]> = [];
        const dlcNodes = [...document.querySelectorAll<HTMLElement>(".game_area_dlc_row")];
        if (dlcNodes.length > 0) {
            for (const node of dlcNodes) {
                if (node.dataset.dsAppid) {
                    const dlcAppid = new AppId(Number(node.dataset.dsAppid));
                    ids.push(dlcAppid);
                    dlcNodeMap.push([dlcAppid, node]);
                }
            }
        }

        if (ids.length === 0) {
            return;
        }

        await DynamicStore.onReady();
        this.#highlighter.insertStyles();

        const setup: HighlightMap = await this.#highlighter.query(ids);
        this.#highlightTitle(setup, appid);
        this.#highlightDlcs(setup, dlcNodeMap);

        await tick();
        this.#highlighter.clearDisconnectedTags();
    }

    #highlightTitle(setup: HighlightMap, appid: AppId) {
        if (!setup.has(appid.string)) {
            return;
        }

        const appHubName = document.querySelector<HTMLElement>("#appHubAppName");
        if (!appHubName) {
            return;
        }

        const {h, t} = setup.get(appid.string)!;
        this.#highlighter.highlight(h, EHighlightStyle.Color, appHubName!);
        this.#highlighter.tags(t, appHubName!);
    }

    #highlightDlcs(setup: HighlightMap, dlcNodeMap: Array<[GameId, HTMLElement]>) {
        for (const [id, node] of dlcNodeMap) {
            const options = setup.get(id.string);

            if (options?.h) {
                this.#highlighter.highlight(options.h, EHighlightStyle.BgGradient, node);
            }

            if (options?.t) {
                const nameNode = node.querySelector(".game_area_dlc_name");
                if (nameNode) {
                    this.#highlighter.tags(options.t, nameNode);
                }
            }
        }
    }
}
