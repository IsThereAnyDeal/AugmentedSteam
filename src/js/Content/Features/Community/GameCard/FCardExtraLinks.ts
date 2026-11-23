import self_ from "./FCardExtraLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FCardExtraLinks extends Feature<CGameCard> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {

        const appid = this.context.appid;
        const isFoil = this.context.isFoil;
        const isSaleAppid = this.context.saleAppids.includes(this.context.appid);

        let node = document.querySelector<HTMLElement>(".badge_detail_tasks > .gamecards_inventorylink");
        if (node) {
            mount(self_, {
                target: node,
                props: {
                    appid,
                    isFoil,
                    isSaleAppid,
                    wrap: false
                }
            });
            return null;
        }

        node = document.querySelector<HTMLElement>(".badge_detail_tasks");
        if (node) {
            mount(self_, {
                target: node,
                anchor: node?.firstElementChild ?? undefined,
                props: {
                    appid,
                    isFoil,
                    isSaleAppid,
                    wrap: true
                }
            });
        }

        throw new MountTargetError();
    }
}
