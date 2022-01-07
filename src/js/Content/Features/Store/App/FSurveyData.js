import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization} from "../../../../modulesCore";

export default class FSurveyData extends Feature {

    async checkPrerequisites() {
        if (this.context.isVideo
            || this.context.isDlc
            || !document.querySelector(".sys_req")) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.survey) {
            return false;
        }

        this._survey = result.survey;
        return true;
    }

    apply() {

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

        /*
         * FIXME
         * if (this.context.isOwnedAndPlayed) {
         *   html += `<a class="btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs"
         *      href="${Config.PublicHost}/survey/?appid=${this.context.appid}"><span>${Localization.str.survey.take}</span></a>`;
         * }
         */

        html += "</div>";

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode, html);
    }

    _getBarHtml(name, data) {
        if (data > 90 || data < 10) {
            return `<div class="row"><div class="left-bar ${name.toLowerCase()}" style="width: ${parseInt(data)}%;"><span>${name}&nbsp;${data}%</span></div><div class="right-bar" style="width: ${parseInt(100 - data)}%;"></div></div>`;
        } else {
            return `<div class="row"><div class="left-bar ${name.toLowerCase()}" style="width: ${parseInt(data)}%;"><span>${name}</span></div><div class="right-bar" style="width: ${parseInt(100 - data)}%;"><span>${data}%</span></div></div>`;
        }
    }
}
