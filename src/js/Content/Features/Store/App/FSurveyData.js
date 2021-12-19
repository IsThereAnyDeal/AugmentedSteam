import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization} from "../../../../modulesCore";
import {Background, User} from "../../../modulesContent";
import {Page} from "../../Page";

const COLORS = Object.freeze({
    "good": "#8bc53f",
    "ok": "#e1c48a",
    "bad": "#8f0e10",
});

// We need to define the order here, i.e. use arrays instead of objects
const QUESTIONS = [
    ["framerate", [
        ["th", COLORS.bad],
        ["sx", COLORS.ok],
        ["va", COLORS.good],
    ]],
    ["optimized", [
        ["yes", COLORS.good],
        ["no", COLORS.bad],
    ]],
    ["lag", [
        ["yes", COLORS.bad],
        ["no", COLORS.good],
    ]],
    ["graphics_settings", [
        ["no", COLORS.bad],
        ["bs", COLORS.ok],
        ["gr", COLORS.good],
    ]],
    ["bg_sound", [
        ["yes", null],
        ["no", null],
    ]],
    ["good_controls", [
        ["yes", COLORS.good],
        ["no", COLORS.bad],
    ]],
];

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

            QUESTIONS.map(([question, values]) => [question, Object.fromEntries(values)]);

            html += this._getResultHtml(survey, QUESTIONS.map(([question, values]) => [question, Object.fromEntries(values)]));
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

        }), [Localization.str.survey.take, this._buildForm()], true);

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

    _buildForm() {
        let html = '<form id="es_submit_survey">';

        for (const [question, values] of QUESTIONS) {

            html += `<div class="as-survey-form__question--unanswered js-survey-form__question">
                <h3 class="as-survey-form__title">${Localization.str.survey.questions[question].question}</h3>
                <select class="as-survey-form__select" name="${question}">`;

            for (const [value] of values) {
                html += `<option value="${value}">${Localization.str.survey.questions[question].answers[value]}</option>`;
            }

            html += `<option value="ns" selected>${Localization.str.survey.not_sure}</option></select></div>`;
        }

        html += "</form>";
        return html;
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
