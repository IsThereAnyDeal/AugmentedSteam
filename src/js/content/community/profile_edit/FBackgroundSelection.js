import {ASFeature} from "modules/ASFeature";

import {HTML, Localization} from "core";
import {Background, ExtensionLayer, SteamId} from "common";
import {ProfileData} from "community/common";
import Config from "config";

export class FBackgroundSelection extends ASFeature {

    checkPrerequisites() {
        return window.location.pathname.includes("/settings");
    }

    async apply() {

        let html =
            `<div class='group_content group_summary'>
                <div class='formRow'>
                    ${Localization.str.custom_background}:
                    <span class='formRowHint' data-tooltip-text='${Localization.str.custom_background_help}'>(?)</span>
                </div>
                <div id="es_bg" class="es_profile_group">
                    <div id='es_bg_game_select'><select name='es_bg_game' id='es_bg_game' class='gray_bevel dynInput' style="display:none"></select></div>
                    <div id='es_bg_img_select'><select name='es_bg_img' id='es_bg_img' class='gray_bevel dynInput' style="display:none"></select></div>
                    <div class='es_loading'>
                        <img src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'>
                        <span>${Localization.str.loading}</span>
                    </div>
                    <img id='es_bg_preview' class="es_profile_preview" src=''>
                    <div id="es_bg_buttons" class="es_profile_buttons">
                        <span id='es_background_remove_btn' class='btn_grey_white_innerfade btn_small'>
                            <span>${Localization.str.remove}</span>
                        </span>&nbsp;
                        <span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'>
                            <span>${Localization.str.save}</span>
                        </span>
                    </div>
                </div>
            </div>`;

        HTML.beforeBegin(".group_content_bodytext", html);
        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

        let response = await Background.action('profile.background.games');

        let gameSelectNode = document.querySelector("#es_bg_game");
        let imgSelectNode = document.querySelector("#es_bg_img");

        let gameList = this._getGameSelectOptions(response);
        HTML.inner(gameSelectNode, gameList[1]);
        gameSelectNode.style.display = "block";

        let currentImg = ProfileData.getBgImgUrl(622,349);
        if (currentImg) {
            document.querySelector("#es_bg_preview").src = currentImg;
            this._onGameSelected();
        }

        this._hideBgFormLoading();

        // on game selected
        gameSelectNode.addEventListener("change", this._onGameSelected);
        imgSelectNode.addEventListener("change", this._onImgSelected);

        document.querySelector("#es_background_remove_btn").addEventListener("click", async () => {
            await ProfileData.clearOwn();
            window.location.href = `${Config.ApiServerHost}/v01/profile/background/edit/delete/`;
        });

        document.querySelector("#es_background_save_btn").addEventListener("click", async e => {
            if (e.target.closest("#es_background_save_btn").classList.contains("btn_disabled")) { return; }
            await ProfileData.clearOwn();

            let selectedAppid = encodeURIComponent(gameSelectNode.value);
            let selectedImg = encodeURIComponent(imgSelectNode.value);
            window.location.href = `${Config.ApiServerHost}/v01/profile/background/edit/save/?appid=${selectedAppid}&img=${selectedImg}`;
        });
    }

    _getGameSelectOptions(games) {
        let selectedAppid = ProfileData.getBgAppid();
        let selected = false;

        let html = "<option value='0' id='0'>" + Localization.str.noneselected + "</option>";
        for (let game of games) {
            let id = parseInt(game[0]);
            let title = HTML.escape(game[1]);

            let selectedAttr = "";
            if (selectedAppid === id) {
                selectedAttr = " selected='selected'";
                selected = true;
            }
            html += `<option value='${id}'${selectedAttr}>${title}</option>`;
        }

        return [selected, html];
    }

    async _onGameSelected() {
        let appid = parseInt(document.querySelector("#es_bg_game").value);

        let imgSelectNode = document.querySelector("#es_bg_img");
        imgSelectNode.style.display = "none";

        if (appid === 0) {
            document.querySelector("#es_bg_preview").src = "";
            return
        }

        this._showBgFormLoading();

        let result = await Background.action("profile.background", {
            appid: appid,
            profile: SteamId.getSteamId(),
        });

        let selectedImg = ProfileData.getBgImg();

        let html = "";
        for (let value of result) {
            let img = HTML.escape(value[0].toString());
            let name = HTML.escape(value[1].toString());

            let selectedAttr = "";
            if (img === selectedImg) {
                selectedAttr = " selected='selected'";
            }

            html += `<option value='${img}'${selectedAttr}>${name}</option>`;
        }

        HTML.inner(imgSelectNode, html);
        imgSelectNode.style.display="block";
        this._hideBgFormLoading();

        this._onImgSelected();

        // Enable the "save" button
        document.querySelector("#es_background_save_btn").classList.remove("btn_disabled");
    }

    _showBgFormLoading() {
        document.querySelector("#es_bg .es_loading").style.display = "block";
    }

    _hideBgFormLoading() {
        document.querySelector("#es_bg .es_loading").style.display = "none";
    }

    _onImgSelected() {
        document.querySelector("#es_bg_preview").src
            = "https://steamcommunity.com/economy/image/" + document.querySelector("#es_bg_img").value + "/622x349";
    }
}
