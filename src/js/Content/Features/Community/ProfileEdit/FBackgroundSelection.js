import {HTML, Localization, TimeUtils} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";
import Config from "../../../../config";

export default class FBackgroundSelection extends Feature {

    async checkPrerequisites() {

        const result = await this.context.data;
        if (!result) { return false; }

        const {img, appid} = result.bg || {};

        this._currentImage = img || ""; // @type string
        this._currentAppid = appid ? parseInt(appid) : 0; // @type number
        this._selectedImage = this._currentImage;
        this._selectedAppid = this._currentAppid;
        return true;
    }

    apply() {

        this._active = false;

        this._checkPage();

        new MutationObserver(() => { this._checkPage(); })
            .observe(document.querySelector('[class^="profileeditshell_PageContent_"]'), {"childList": true});
    }

    async _checkPage() {

        const html
            = `<div class="js-bg-selection as-pd">

                <div class="DialogLabel as-pd__head" data-tooltip-text="${Localization.str.custom_background_help}">
                    ${Localization.str.custom_background} <span class="as-pd__help">(?)</span>
                </div>

                <div class="DialogInput_Wrapper _DialogLayout">
                    <input type="text" class="DialogInput DialogInputPlaceholder DialogTextInputBase js-pd-game" value="" placeholder="${Localization.str.game_name}">
                </div>

                <div class="as-pd__cnt">
                    <div class="as-pd__list js-pd-list"></div>
                </div>

                <div class="as-pd__cnt">
                    <div class="as-pd__imgs js-pd-imgs"></div>
                </div>

                <div class="as-pd__buttons">
                    <button class="DialogButton _DialogLayout Secondary as-pd__btn js-pd-bg-clear">${Localization.str.thewordclear}</button>
                    <button class="DialogButton _DialogLayout Primary as-pd__btn js-pd-bg-save">${Localization.str.save}</button>
                </div>
            </div>`;

        if (document.querySelector('[href$="/edit/background"].active')) {

            if (this._active) { return; } // Happens because the below code will trigger the observer again

            HTML.beforeEnd('[class^="profileeditshell_PageContent_"]', html);
            this._active = true;

            const gameFilterNode = document.querySelector(".js-pd-game");
            const listNode = document.querySelector(".js-pd-list");
            const imagesNode = document.querySelector(".js-pd-imgs");

            let selectedGameKey = null;

            this._showBgFormLoading(listNode);

            const games = await Background.action("profile.background.games");

            for (const key in games) {
                if (!Object.prototype.hasOwnProperty.call(games, key)) { continue; }
                games[key][2] = this._getSafeString(games[key][1]);

                if (games[key][0] === this._selectedAppid) {
                    selectedGameKey = key;
                }
            }

            this._hideBgFormLoading(listNode);

            listNode.addEventListener("click", ({target}) => {
                const appid = Number(target.dataset.appid ?? 0);
                if (!appid || appid === this._selectedAppid) { return; }

                this._selectedImage = ""; // Clear current selection so selected image and appid remain in sync
                this._selectGame(appid, imagesNode);

                document.querySelector(".js-pd-item.is-selected")?.classList.remove("is-selected");
                target.classList.add("is-selected");
            });

            imagesNode.addEventListener("click", ({target}) => {
                const node = target.closest(".js-pd-img");
                if (!node || node.dataset.img === this._selectedImage) { return; }

                this._selectedImage = node.dataset.img;

                document.querySelector(".js-pd-img.is-selected")?.classList.remove("is-selected");
                node.classList.add("is-selected");
            });

            let timer = null;

            gameFilterNode.addEventListener("keyup", () => {

                if (!timer) {
                    timer = TimeUtils.resettableTimer(() => {

                        const max = 100;
                        const value = this._getSafeString(gameFilterNode.value);
                        if (value === "") { return; }

                        let i = 0;
                        let list = "";
                        for (const [appid, title, safeTitle] of games) {
                            if (safeTitle.includes(value)) {
                                const selected = this._selectedAppid === appid ? " is-selected" : "";

                                list += `<div class="as-pd__item${selected} js-pd-item" data-appid="${appid}">${title}</div>`;
                                i++;
                            }
                            if (i >= max) { break; }
                        }
                        HTML.inner(listNode, list);
                    }, 200);
                }

                timer.reset();
            });

            // Show current selection
            if (games[selectedGameKey]) {
                gameFilterNode.value = games[selectedGameKey][1];

                if (this._selectedAppid) {
                    this._selectGame(this._selectedAppid, imagesNode);
                }
            }

            document.querySelector(".js-pd-bg-clear").addEventListener("click", async() => {
                if (!this._currentImage && !this._currentAppid) { return; }

                await this.context.clearOwn();

                window.location.href = `${Config.ApiServerHost}/v01/profile/background/edit/delete/`;
            });

            document.querySelector(".js-pd-bg-save").addEventListener("click", async() => {
                if (!this._selectedImage || !this._selectedAppid) { return; }
                if (this._selectedImage === this._currentImage && this._selectedAppid === this._currentAppid) { return; }

                await this.context.clearOwn();

                const appid = encodeURIComponent(this._selectedAppid);
                const img = encodeURIComponent(this._selectedImage);
                window.location.href = `${Config.ApiServerHost}/v01/profile/background/edit/save/?appid=${appid}&img=${img}`;
            });

        } else if (this._active) {
            document.querySelector(".js-bg-selection")?.remove();
            this._active = false;
        }
    }

    _getSafeString(value) {
        return value.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    }

    async _selectGame(appid, imagesNode) {

        const result = await Background.action("profile.background", {
            appid,
            "profile": this.context.steamId,
        });

        this._selectedAppid = appid;

        let images = "";
        for (const [url, title] of result) {
            const selected = this._selectedImage === url ? " is-selected" : "";

            images
                += `<div class="as-pd__item${selected} js-pd-img" data-img="${url}">
                        <img src="${this._getImageUrl(url)}" class="as-pd__img">
                        <div>${title}</div>
                    </div>`;
        }

        HTML.inner(imagesNode, images);
    }

    _getImageUrl(name) {
        return `https://steamcommunity.com/economy/image/${name}/622x349`;
    }

    _showBgFormLoading(node) {
        HTML.inner(node,
            `<div class="es_loading">
                <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                <span>${Localization.str.loading}</span>
            </div>`);
    }

    _hideBgFormLoading(node) {
        node.querySelector(".es_loading").remove();
    }
}
