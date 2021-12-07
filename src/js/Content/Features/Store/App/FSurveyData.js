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

        if (this.context.isOwned() && document.getElementById("my_activity") !== null) {
            html += `<a class="btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs"><span>${Localization.str.survey.take}</span></a>`;
        }

        html += "</div>";

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode, html);

        document.querySelector(".es_btn_systemreqs").addEventListener("click", () => { this._showForm(); });
    }

    async _showForm() {

        const form = `<form id="es_submit_survey">
            <div>
                <h3 class="as-survey-form__title">Please select your monitor's native resolution</h3>
                <select name="mr" style="width: initial;">
                    <option value="less">Less than 1920x1080 or non-widescreen</option>
                    <option value="hd">1920x1080 (HD)</option>
                    <option value="wqhd">2560x1440 (WQHD)</option>
                    <option value="4k">3840x2160 (4K)</option>
                    <option value="ns" selected="">Other / Not Sure</option>
                </select>
            </div>

            <div>
                <h3 class="as-survey-form__title">Does the game allow you to play fullscreen at this resolution without stretching?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fs" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fs" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fs" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div>
                <h3 class="as-survey-form__title">Is the game's framerate: </h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fr" style="margin-left: 1px;" value="30">
                    Fixed at 30fps or less
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fr" style="margin-left: 1px;" value="fi">
                    Fixed at higher than 30fps
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fr" style="margin-left: 1px;" value="va">
                    Variable
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="fr" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div>
                <h3 class="as-survey-form__title">Does this game have built-in graphics options, such as a "Graphics Settings" menu?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="gs" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="gs" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="gs" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div>
                <h3 class="as-survey-form__title">Do you think the game performs well?</h3>
                <label style="margin-left: 5px;">
                    <input type="radio" name="pw" style="margin-left: 1px;" value="yes">
                    Yes
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="pw" style="margin-left: 1px;" value="no">
                    No
                </label>
                <label style="margin-left: 5px;">
                    <input type="radio" name="pw" style="margin-left: 1px;" value="ns" checked="">
                    Not Sure
                </label>
            </div>

            <div>
                <h3 class="as-survey-form__title">Please select your graphics card manufacturer</h3>
                <select name="gc" style="width: initial;">
                    <option value="nvidia">Nvidia</option>
                    <option value="amd">AMD</option>
                    <option value="intel">Intel</option>
                    <option value="ns" selected="">Other / Not Sure</option>
                </select>
            </div>
        </form>`;

        await Page.runInPageContext((surveyStr, form) => new Promise(resolve => {
            window.SteamFacade.showConfirmDialog(surveyStr, form);

            const okBtn = window.SteamFacade.jq(".newmodal_buttons > .btn_green_steamui");

            okBtn.off("click");
            okBtn.click(() => { resolve(); });
        }), [Localization.str.survey.take, form], true);

        const fd = new FormData(document.getElementById("es_submit_survey"));
        fd.append("steam_id", User.steamId); // The user is logged in since they can only take the survey when they own a game
        fd.append("appid", this.context.appid);

        await Background.action("survey.submit", Object.fromEntries(fd));
    }

    _getBarHtml(name, data) {
        if (data > 90 || data < 10) {
            return `<div class="row"><div class="left-bar ${name.toLowerCase()}" style="width: ${parseInt(data)}%;"><span>${name}&nbsp;${data}%</span></div><div class="right-bar" style="width: ${parseInt(100 - data)}%;"></div></div>`;
        } else {
            return `<div class="row"><div class="left-bar ${name.toLowerCase()}" style="width: ${parseInt(data)}%;"><span>${name}</span></div><div class="right-bar" style="width: ${parseInt(100 - data)}%;"><span>${data}%</span></div></div>`;
        }
    }
}
