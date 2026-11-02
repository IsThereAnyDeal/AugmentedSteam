import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import ServiceFactory from "@Protobufs/ServiceFactory";
import {DateTime} from "luxon";
import {MountTargetError} from "@Core/Errors/Errors";

/**
 * Adds exact release date to release countdown display in coming soon games
 */
export default class FReleaseCountdown extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const comingSoon: HTMLElement|null = document.querySelector<HTMLDivElement>(".game_area_comingsoon");
        if (!comingSoon) {
            throw new MountTargetError();
        }

        const service = ServiceFactory.StoreBrowseService(this.context.user);
        const response = await service.getItems({
            ids: [{appid: this.context.appid}],
            context: {
                language: this.context.language?.name,
                countryCode: this.context.user.storeCountry
            },
            dataRequest: {
                includeRelease: true
            }
        });

        if (response.storeItems.length === 0) {
            return null;
        }

        const release = response.storeItems[0]!.release;
        if (!release) {
            return null;
        }

        const {steamReleaseDate, comingSoonDisplay, isComingSoon} = release;
        if (!isComingSoon) {
            return null;
        }

        // TODO what other values would be valid here?
        if (comingSoonDisplay !== "date_full") {
            return null;
        }

        if (steamReleaseDate && Number.isInteger(steamReleaseDate)) {
            const date = (DateTime.fromSeconds(steamReleaseDate)).toLocaleString({
                dateStyle: "medium",
                timeStyle: "short"
            }, {
                locale: this.context.language?.code ?? undefined
            })
            const str = ` (${date})`;

            const target = comingSoon.querySelector(".content p");
            target?.append(str);
        }
        return null;
    }
}
