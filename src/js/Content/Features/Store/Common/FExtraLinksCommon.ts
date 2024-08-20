import Feature from "@Content/Modules/Context/Feature";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";
import ContextType from "@Content/Modules/Context/ContextType";
import CommonExtraLinks from "@Content/Features/Common/CommonExtraLinks.svelte";
import type CSub from "@Content/Features/Store/Sub/CSub";

export default class FExtraLinksCommon extends Feature<CSub|CBundle> {

    override apply(): void {

        let type: "sub"|"bundle";
        let gameid: number;
        let target: HTMLElement|null = null;

        if (this.context.type === ContextType.SUB) {
            type = "sub";
            gameid = (<CSub>(this.context)).subid;
            target = document.querySelector(".share")?.parentElement ?? null;
        } else {
            type = "bundle";
            gameid = (<CBundle>(this.context)).bundleid;
            target = document.querySelector(".share, .rightcol .game_details");
        }

        if (!target) {
            throw new Error("Node not found");
        }

        (new CommonExtraLinks({
            target,
            anchor: target.firstElementChild!,
            props: {type, gameid}
        }));
    }
}
