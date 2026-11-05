import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle, type ItemSetup} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import AppId from "@Core/GameId/AppId";
import GameId from "@Core/GameId/GameId";
import SubId from "@Core/GameId/SubId";
import {MountTargetError} from "@Core/Errors/Errors";
import {tick} from "svelte";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";
import type CSub from "@Content/Features/Store/Sub/CSub";

export default class FPackageHighlights extends Feature<CBundle|CSub> {

    private highlighter: HighlightsTagsUtils2;

    constructor(context: CBundle|CSub) {
        super(context);
        this.highlighter = new HighlightsTagsUtils2();
    }

    override async isEnabled(): Promise<boolean> {
        return this.highlighter.isEnabled();
    }

    override async apply(): Promise<string|null> {
        const nodes = document.querySelectorAll<HTMLDivElement>(".tab_item[data-ds-appid],.tab_item[data-ds-packageid]");
        if (nodes.length === 0) {
            throw new MountTargetError();
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

        this.highlighter.insertStyles();

        const map: Map<string, ItemSetup> = await this.highlighter.query(gameids);

        for (const [gameid, node] of nodeMap.values()) {
            const setup = map.get(gameid.string);

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
        return null;
    }
}
