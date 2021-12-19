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

            html += this._getResultHtml(survey, [
                ["framerate", {
                    "th": "#8f0e10",
                    "sx": "#e1c48a",
                    "va": "#8BC53F",
                }],
                ["optimized", {
                    "yes": "#8BC53F",
                    "no": "#8f0e10",
                }],
                ["lag", {
                    "yes": "#8f0e10",
                    "no": "#8BC53F",
                }],
                ["graphics_settings", {
                    "no": "#8f0e10",
                    "bs": "#e1c48a",
                    "gr": "#8BC53F",
                }],
                ["bg_sound", {
                    "yes": null,
                    "no": null,
                }],
                ["good_controls", {
                    "yes": "#8BC53F",
                    "no": "#8f0e10",
                }],
            ]);
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

    // TODO Show if survey was already taken
    async _showForm() {

        const form = `<form id="es_submit_survey">
            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">What is this game's frame rate?</h3>
                <select class="as-survey-form__select" name="framerate">
                    <option value="th">Fixed at 30 FPS or less</option>
                    <option value="sx">Fixed at 60 FPS or less</option>
                    <option value="va">Variable</option>
                    <option value="ns" selected>Other / Not Sure</option>
                </select>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Do you think that the game is well optimized?</h3>
                <select class="as-survey-form__select" name="optimized">
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                    <option value="ns" selected>Other / Not Sure</option>
                </select>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Does this game suffer from any sort of input lag or desynchronization?</h3>
                <select class="as-survey-form__select" name="lag">
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                    <option value="ns" selected>Other / Not Sure</option>
                </select>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">How customizable are this game's graphics settings?</h3>
                <select class="as-survey-form__select" name="graphics_settings">
                    <option value="no">Not existent</option>
                    <option value="bs">Basic</option>
                    <option value="gr">Granular</option>
                    <option value="ns" selected>Other / Not Sure</option>
                </select>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Will the game sounds mute when the game is in the background?</h3>
                <select class="as-survey-form__select" name="bg_sound">
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                    <option value="ns" selected>Other / Not Sure</option>
                </select>
            </div>

            <div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">Does this game have good controls?</h3>
                <select class="as-survey-form__select" name="good_controls">
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                    <option value="ns" selected>Other / Not Sure</option>
                </select>
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

            jq("#es_submit_survey select").change(() => {
                const anyAnswered = jq("#es_submit_survey option:checked:not([value='ns'])").length > 0;

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

        // TODO Display errors
        await Background.action("survey.submit", Object.fromEntries(fd));

        document.querySelector(".newmodal_buttons > .btn_green_steamui").click();
    }

    _getResultHtml(survey, config) {
        let html = `<p>${Localization.str.survey.users.replace("__users__", survey.responses)}</p><p>`;

        for (const [name, colors] of config) {
            html += `<b>${Localization.str.survey.questions[name].name}</b>: ${survey[`${name}p`]}% `;

            let value = survey[name];
            if (value === 0) {
                value = "no";
            } else if (value === 1) {
                value = "yes";
            }

            const color = colors[value];

            html += `<span style="color: ${color ?? "unset"};">${Localization.str.survey.questions[name].responses[value]}</span><br>`;
        }

        html += "</p>";

        return html;
    }
}
