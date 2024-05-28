import Feature from "@Content/Modules/Context/Feature";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";
import {ContextType} from "@Content/Modules/Context/ContextType";
import Settings from "@Options/Data/Settings";
import CommonLinks from "@Content/Features/Store/Common/ExtraLinks/CommonLinks.svelte";
import type CSub from "@Content/Features/Store/Sub/CSub";

export default class FExtraLinksCommon extends Feature<CSub|CBundle> {

    // @ts-ignore
    private _type: "sub"|"bundle";
    // @ts-ignore
    private _gameid: number;
    private _node: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        if (this.context.type === ContextType.SUB) {
            this._type = "sub";
            this._gameid = (<CSub>(this.context)).subid;
            this._node = (document.querySelector<HTMLElement>(".share")?.parentNode ?? null) as HTMLElement|null;
        } else if (this.context.type === ContextType.BUNDLE) {
            this._type = "bundle";
            this._gameid = (<CBundle>(this.context)).bundleid;
            this._node = document.querySelector<HTMLElement>(".share, .rightcol .game_details");
        }

        if (!this._node) {
            console.warn("Couldn't find element to insert extra links");
        }

        return this._node !== null && (
                // Preferences for links shown on all pages
                (Settings.showbartervg || Settings.showsteamdb || Settings.showitadlinks
            )
        );
    }

    apply() {
        (new CommonLinks({
            target: this._node!,
            anchor: this._node!.firstElementChild ?? undefined,
            props: {
                type: this._type,
                gameid: this._gameid
            }
        }));
    }
}
