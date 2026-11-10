import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle, type ItemSetup} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import AppId from "@Core/GameId/AppId";
import GameId from "@Core/GameId/GameId";
import SubId from "@Core/GameId/SubId";
import type CSearch from "@Content/Features/Store/Search/CSearch";

export default class FSearchHighlights extends Feature<CSearch> {

    private readonly highlighter: HighlightsTagsUtils2;

    constructor(context: CSearch) {
        super(context);
        this.highlighter = new HighlightsTagsUtils2();
    }

    override async isEnabled(): Promise<boolean> {
        return this.context.user.isSignedIn && this.highlighter.isEnabled();
    }
    
    override async apply(): Promise<string|null> {
        this.highlighter.insertStyles();

        this.#highlight();
        this.context.onMutation(() => {
            this.#highlight();
        });
        return null;
    }

    async #highlight(): Promise<void> {
        const nodes = document.querySelectorAll<HTMLDivElement>(".search_result_row[data-ds-appid],.search_result_row[data-ds-packageid]");
        if (nodes.length === 0) {
            return;
        }

        const nodeMap: Map<string, [GameId, HTMLDivElement]> = new Map();
        let gameids: GameId[] = [];
        for(const node of nodes) {
            const dsAppid = Number(node.dataset.dsAppid);
            if (Number.isFinite(dsAppid)) {
                const appid = new AppId(Number(node.dataset.dsAppid))
                gameids.push(appid);
                nodeMap.set(appid.string, [appid, node]);
                continue;
            }

            const dsPackageid = Number(node.dataset.dsPackageid);
            if (Number.isFinite(dsPackageid)) {
                const subid = new SubId(Number(node.dataset.dsPackageid))
                gameids.push(subid);
                nodeMap.set(subid.string, [subid, node]);
                continue;
            }
        }

        const map: Map<string, ItemSetup> = await this.highlighter.query(gameids);

        for (const [gameid, node] of nodeMap.values()) {
            const setup = map.get(gameid.string);

            if (setup?.h) {
                this.highlighter.highlight(setup.h, EHighlightStyle.BgGradient, node);
            }

            if (setup?.t) {
                const titleNode = node.querySelector<HTMLElement>(".search_name");
                if (titleNode) {
                    this.highlighter.tags(setup.t, titleNode);
                }
            }
        }

        this.highlighter.clearDisconnectedTags();
        nodeMap.clear();
    }
}
