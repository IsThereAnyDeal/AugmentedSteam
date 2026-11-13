import AppId from "@Core/GameId/AppId";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CBadges from "@Content/Features/Community/Badges/CBadges";
import {mount} from "svelte";
import CardExchangeLink from "@Content/Features/Community/CardExchangeLink.svelte";

export default class FCardExchangeLinks extends Feature<CBadges> {

    override async isEnabled(): Promise<boolean> {
        return Settings.steamcardexchange;
    }

    override async apply():Promise<string|null> {
        this.context.pageUpdateEvent.subscribe(() => this.#onPageUpdated(), true);
        return null;
    }

    #onPageUpdated(): void {
        for (const node of document.querySelectorAll<HTMLElement>(".badge_row:not([data-as-ce-link])")) {
            const overlay = node.querySelector<HTMLAnchorElement>("a.badge_row_overlay");
            if (!overlay) {
                console.warn("Overlay not found");
                continue;
            }

            const appid = AppId.fromGameCardUrl(overlay.href);
            if (!appid) {
                console.warn("Appid not found");
                continue;
            }

            const target = node.querySelector(".badge_title_row");
            if (!target) {
                console.warn(".badge_title_row not found");
                continue;
            }

            mount(CardExchangeLink, {
                target,
                anchor: target.firstElementChild ?? undefined,
                props: {
                    appid
                }
            });

            node.dataset.asCeLink = "1";
        }
    }
}
