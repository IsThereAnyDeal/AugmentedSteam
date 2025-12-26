import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle, type ItemSetup} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import AppId from "@Core/GameId/AppId";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";
import GameId from "@Core/GameId/GameId";

export default class FBundleHighlights extends Feature<CBundle> {

    // @ts-expect-error
    private highlighter: HighlightsTagsUtils2;

    override checkPrerequisites(): boolean {
        if (!this.context.user.isSignedIn) {
            return false; // TODO ITAD status
        }

        this.highlighter = new HighlightsTagsUtils2();
        return this.highlighter.isEnabled();
    }

    override async apply(): Promise<void> {
        const nodes = document.querySelectorAll<HTMLDivElement>(".tab_item[data-ds-appid]");
        if (nodes.length === 0) {
            return;
        }

        const nodeMap: Map<string, [GameId, HTMLDivElement]> = new Map();
        let appids: GameId[] = [];
        for(const node of nodes) {
            const appid = new AppId(Number(node.dataset.dsAppid))
            appids.push(appid);
            nodeMap.set(appid.string, [appid, node]);
        }

        this.highlighter.insertStyles();

        const map: Map<string, ItemSetup> = await this.highlighter.query(appids);

        for (const [appid, node] of nodeMap.values()) {
            const setup = map.get(appid.string);

            if (setup?.h) {
                this.highlighter.highlight(setup.h, EHighlightStyle.BgGradient, node);
            }

            if (setup?.t) {
                const titleNode = node.querySelector<HTMLElement>(".tab_item_name");
                if (titleNode) {
                    this.highlighter.tags(setup.t, titleNode);
                }
            }
        }

        this.highlighter.clearDisconnectedTags();
    }
}
