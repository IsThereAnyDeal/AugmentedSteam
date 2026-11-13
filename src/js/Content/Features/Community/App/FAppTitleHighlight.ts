import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import {MountTargetError} from "@Core/Errors/Errors";
import type CApp from "@Content/Features/Community/App/CApp";
import AppId from "@Core/GameId/AppId";

/*
 * TODO I'm not sure this is still relevant/still works
 */
export default class FAppTitleHighlight extends Feature<CApp> {

    readonly #highlighter: HighlightsTagsUtils2;

    constructor(context: CApp) {
        super(context);
        this.#highlighter = new HighlightsTagsUtils2();
    }

    override async isEnabled(): Promise<boolean> {
        return this.#highlighter.isEnabled();
    }

    override async apply(): Promise<string|null> {
        if (!this.context.appid) {
            return "Appid not found";
        }

        const target = document.querySelector<HTMLElement>(".apphub_AppName");
        if (!target) {
            throw new MountTargetError();
        }

        const appid = new AppId(this.context.appid);
        const setup = (await this.#highlighter.query([appid])).get(appid.string);

        this.#highlighter.insertStyles();
        this.#highlighter.highlight(setup?.h, EHighlightStyle.Color, target);
        this.#highlighter.tags(setup?.t, target)
        return null;
    }
}
