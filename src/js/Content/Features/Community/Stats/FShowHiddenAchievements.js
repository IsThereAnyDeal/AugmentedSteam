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

            let achievements = await this.context.getAchievementData();
            achievements = Object.values({...achievements.open}).filter(val => val.hidden);

            for (const ach of achievements) {

                let achieveTxtClass = "achieveTxt";
                let progressHtml = "";
                const progress = typeof ach.progress === "object" && ach.progress;

                if (progress) {
                    achieveTxtClass += " withProgress";

                    const width = Math.round(progress.amtComplete * 100);
                    if (width > 50) {
                        progressHtml += `<div class="achievementProgressBar ellipsis">
                            <div class="progress" style="width: ${width}%">
                                <div class="progressText inBar ellipsis"> ${progress.currentVal ?? progress.min_val} / ${progress.max_val} </div>
                            </div>
                        </div>`;
                    } else {
                        progressHtml += `<div class="achievementProgressBar ellipsis">
                            <div class="progress" style="width: ${width}%"> </div>
                            <div class="progressText nextToBar ellipsis"> ${progress.currentVal ?? progress.min_val} / ${progress.max_val} </div>
                        </div>`;
                    }
                }

                HTML.afterEnd(parent,
                    `<div class="achieveRow">
                        <div class="achieveImgHolder">
                            <img src="${ach.icon_open}">
                        </div>
                        <div class="achieveTxtHolder">
                            <div class="${achieveTxtClass}">
                                <h3 class="ellipsis">${ach.name}</h3>
                                <h5 class="ellipsis">${ach.desc}</h5>
                                ${progressHtml}
                            </div>
                        </div>
                    </div>`);
            }

            parent.remove();
        });
    }
}
