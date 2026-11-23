import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import {mount} from "svelte";
import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import {MountTargetError} from "@Core/Errors/Errors";
import CardExchangeLink from "@Content/Features/Community/CardExchangeLink.svelte";

export default class FCardExchangeLinks extends Feature<CGameCard> {

    override async isEnabled(): Promise<boolean> {
        return Settings.steamcardexchange;
    }

    override async apply():Promise<string|null> {
        const target = document.querySelector<HTMLElement>(".badge_title_row");
        if (!target) {
            throw new MountTargetError();
        }

        mount(CardExchangeLink, {
            target,
            anchor: target.firstElementChild ?? undefined,
            props: {
                appid: this.context.appid
            }
        });
        return null;
    }
}
