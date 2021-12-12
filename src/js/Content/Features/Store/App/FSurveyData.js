import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization} from "../../../../modulesCore";
import {Background, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FSurveyData extends Feature {

    async checkPrerequisites() {
        if (this.context.isVideo() || this.context.isDlc() || !document.querySelector(".sys_req")) { return false; }

        const result = await this.context.data;
        if (result && result.survey) {
            this._survey = result.survey;
        }

        return typeof this._survey !== "undefined";
    }

    apply() {
        this._showData();
    }

    _showData() {
        const survey = this._survey;
        let html = `<div id="performance_survey" class="game_area_description"><h2>${Localization.str.survey.performance_survey}</h2>`;

        if (survey.success) {
            html += `<p>${Localization.str.survey.users.replace("__users__", survey.responses)}</p>`;

            html += `<p><b>${Localization.str.survey.framerate}</b>: ${Math.round(survey.frp)}% ${Localization.str.survey.framerate_response}`;
            switch (survey.fr) {
                case "30": html += ` <span style="color: #8f0e10;">${Localization.str.survey.framerate_30}</span>`; break;
                case "fi": html += ` <span style="color: #e1c48a;">${Localization.str.survey.framerate_fi}</span>`; break;
                case "va": html += ` <span style="color: #8BC53F;">${Localization.str.survey.framerate_va}</span>`; break;
            }

            html += `<br><b>${Localization.str.survey.resolution}</b>: ${Localization.str.survey.resolution_support}`;
            switch (survey.mr) {
                case "less": html += ` <span style="color: #8f0e10;">${Localization.str.survey.resolution_less.replace("__pixels__", "1920x1080")}</span>`; break;
                case "hd": html += ` <span style="color: #8BC53F;">${Localization.str.survey.resolution_up.replace("__pixels__", "1920x1080 (HD)")}</span>`; break;
                case "wqhd": html += ` <span style="color: #8BC53F;">${Localization.str.survey.resolution_up.replace("__pixels__", "2560x1440 (WQHD)")}</span>`; break;
                case "4k": html += ` <span style="color: #8BC53F;">${Localization.str.survey.resolution_up.replace("__pixels__", "3840x2160 (4K)")}</span>`; break;
            }

            html += `<br><b>${Localization.str.survey.graphics_settings}</b>:`;
            if (survey.gs) {
                html += ` <span style="color: #8BC53F;">${Localization.str.survey.gs_y}</span></p>`;
            } else {
                html += ` <span style="color: #8f0e10;">${Localization.str.survey.gs_n}</span></p>`;
            }

            if (["nvidia", "amd", "intel", "other"].some(key => key in survey)) {
                html += `<p><b>${Localization.str.survey.satisfaction}</b>:</p><div class="performance-graph">`;

                if ("nvidia" in survey) { html += this._getBarHtml("Nvidia", survey.nvidia); }
                if ("amd" in survey) { html += this._getBarHtml("AMD", survey.amd); }
                if ("intel" in survey) { html += this._getBarHtml("Intel", survey.intel); }
                if ("other" in survey) { html += this._getBarHtml("Other", survey.other); }

                html += "</div>";
            }
        } else {
            html += `<p>${Localization.str.survey.nobody}</p>`;
        }

        const showBtn = this.context.isOwned() && document.getElementById("my_activity") !== null;

        if (showBtn) {
            html += `<a class="btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs"><span>${Localization.str.survey.take}</span></a>`;
        }

        html += "</div>";

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode, html);

        if (showBtn) {
            document.querySelector(".es_btn_systemreqs").addEventListener("click", () => { this._showForm(); });
        }
    }

    async _showForm() {

        const form = `<form id="es_submit_survey">
            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Is the game's framerate: </h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="framerate" style="margin-left: 1px;" value="30">
                    Fixed at 30 FPS or less
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="framerate" style="margin-left: 1px;" value="60">
                    Fixed at 60 FPS or less
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="framerate" style="margin-left: 1px;" value="va">
                    Variable
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="framerate" style="margin-left: 1px;" value="ns" checked>
                    Not Sure
                </label>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Do you think that the game is well optimized?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="optimized" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="optimized" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="optimized" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Does this game suffer from any sort of input lag or desynchronization?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="lag" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="lag" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="lag" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">How customizable are this game's graphics settings?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="graphics_settings" style="margin-left: 1px;" value="not_existent">
                    Not existent
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="graphics_settings" style="margin-left: 1px;" value="not_granular">
                    Basic
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="graphics_settings" style="margin-left: 1px;" value="granular">
                    Granular
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="graphics_settings" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Will the game sounds mute when the game is in the background?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="bg_sound" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="bg_sound" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="bg_sound" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Does this game have good controls?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="good_controls" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="good_controls" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="good_controls" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>
        </form>`;

        await Page.runInPageContext((surveyStr, form) => new Promise(resolve => {
            window.SteamFacade.showConfirmDialog(surveyStr, form);

            const jq = window.SteamFacade.jq;
            const okBtn = jq(".newmodal_buttons > .btn_green_steamui");

            okBtn.get(0).addEventListener("click", e => {
                resolve();
                e.stopImmediatePropagation();
            }, {
                "capture": true,
                "once": true,
            });

            okBtn.addClass("as-survey-form__submit--disabled");

            jq("#es_submit_survey input").change(({target}) => {
                const question = jq(target).closest(".js-survey-form__question");
                const answered = target.value !== "ns";

                question.toggleClass("as-survey-form__question--unanswered", !answered);
                question.toggleClass("as-survey-form__question--answered", answered);

                const anyAnswered = answered || jq("#es_submit_survey input:checked:not([value='ns'])").length > 0;

                okBtn.toggleClass("as-survey-form__submit--disabled", !anyAnswered);
                okBtn.toggleClass("as-survey-form__submit--enabled", anyAnswered);
            });

        }), [Localization.str.survey.take, form], true);

        const fd = new FormData(document.getElementById("es_submit_survey"));

        // Use Array.from to avoid skipping entries (due to deletion during iteration)
        for (const [key, val] of Array.from(fd.entries())) {
            if (val === "ns") {
                fd.delete(key);
            }
        }

        fd.append("steam_id", User.steamId); // The user is logged in since they can only take the survey when they own a game
        fd.append("appid", this.context.appid);

        await Background.action("survey.submit", Object.fromEntries(fd));

        document.querySelector(".newmodal_buttons > .btn_green_steamui").click();
    }

    _getBarHtml(name, data) {
        if (data > 90 || data < 10) {
            return `<div class="row"><div class="left-bar ${name.toLowerCase()}" style="width: ${parseInt(data)}%;"><span>${name}&nbsp;${data}%</span></div><div class="right-bar" style="width: ${parseInt(100 - data)}%;"></div></div>`;
        } else {
            return `<div class="row"><div class="left-bar ${name.toLowerCase()}" style="width: ${parseInt(data)}%;"><span>${name}</span></div><div class="right-bar" style="width: ${parseInt(100 - data)}%;"><span>${data}%</span></div></div>`;
        }
    }
}
