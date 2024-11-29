import AppId from "@Core/GameId/AppId";
import {__showAll} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileStats from "@Content/Features/Community/ProfileStats/CProfileStats";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";

export default class FShowHiddenAchievements extends Feature<CProfileStats> {

    private _node: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        // Check if there's a "x hidden achievements remaining" row present
        this._node = document.querySelector(".achieveHiddenBox");
        return this._node !== null;
    }

    override apply(): void {

        const img = document.querySelector<HTMLImageElement>(".gameLogo img");
        if (!img) {
            return;
        }

        const appid = AppId.fromImageElement(img);
        if (!appid) {
            return;
        }

        const parent = this._node!.parentNode! as HTMLElement;

        HTML.afterEnd(parent.querySelector(".achieveTxt"),
            `<div id="as_ach_showall" class="btnv6_blue_hoverfade btn_medium">
                <span>${L(__showAll)}</span>
            </div>`);

        const btn = document.getElementById("as_ach_showall")!;
        btn.addEventListener("click", async() => {
            if (btn.classList.contains("btn_disabled")) { return; }

            const visibleAchievements = [...document.querySelectorAll(".achieveTxt")].map(x => {
                return {
                    name: x.querySelector("h3")!.textContent,
                    desc: x.querySelector("h5")!.textContent,
                };
            });

            let achievements = (await this._getAchievements(appid))
                .response.achievements.filter(
                    val => val.hidden
                        && !visibleAchievements.some(
                            x => x.name === val.localized_name && x.desc === val.localized_desc
                        )
                );

            for (const ach of achievements) {
                HTML.afterEnd(parent,
                    `<div class="achieveRow">
                        <div class="achieveImgHolder">
                            <img src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appid}/${ach.icon}">
                        </div>
                        <div class="achieveTxtHolder">
                            <div class="achieveTxt">
                                <h3 class="ellipsis">${ach.localized_name}</h3>
                                <h5>${ach.localized_desc}</h5>
                            </div>
                        </div>
                    </div>`);
            }

            btn.classList.add("btn_disabled");
        });
    }

    async _getAchievements(appid: number) {

        const params = new URLSearchParams();
        params.set("format", "json");
        params.set("access_token", await this.context.user.getWebApiToken());
        params.set("appid", String(appid));
        params.set("language", this.context.language?.name ?? "en");
        params.set("x_requested_with", "AugmentedSteam");

        return RequestData.getJson<{
            response: {
                achievements: Array<{
                    hidden: boolean,
                    localized_name: string,
                    localized_desc: string,
                    icon: string
                }>
            }
        }>(
            `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?${params.toString()}`,
            {"credentials": "omit"}
        );
    }
}
