import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FShowHiddenAchievements extends Feature {

    checkPrerequisites() {
        // Check if there's a "x hidden achievements remaining" row present
        this._node = document.querySelector(".achieveHiddenBox");
        return this._node !== null;
    }

    apply() {

        const parent = this._node.parentNode;

        HTML.afterEnd(parent.querySelector(".achieveTxt"),
            `<div id="as_ach_showall" class="btnv6_blue_hoverfade btn_medium">
                <span>${Localization.str.show_all}</span>
            </div>`);

        const btn = document.getElementById("as_ach_showall");
        btn.addEventListener("click", async() => {
            if (btn.classList.contains("btn_disabled"))
                return;

            let visibleAchievements = [...document.querySelectorAll(".achieveTxt")].map(x => {
                return {
                    name: x.querySelector("h3").innerHTML,
                    desc: x.querySelector("h5").innerHTML,
                }
            });

            let achievements = await this.context.getAchievementData();
            achievements = Object.values({...achievements.response.achievements}).filter(val =>
                val.hidden && !visibleAchievements.some(x =>
                    x.name === val.localized_name && x.desc === val.localized_desc
                )
            );

            for (const ach of achievements) {
                HTML.afterEnd(parent,
                    `<div class="achieveRow">
                        <div class="achieveImgHolder">
                            <img src="//cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${this.context.appid}/${ach.icon}">
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
}
