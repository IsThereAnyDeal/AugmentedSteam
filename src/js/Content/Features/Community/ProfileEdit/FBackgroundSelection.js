import {HTML, Localization, StringUtils, TimeUtils} from "../../../../modulesCore";
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
        this._root = document.querySelector("#react_root");

        this._checkPage();

        new MutationObserver(() => { this._checkPage(); })
            .observe(this._root, {"childList": true, "subtree": true});
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

            HTML.beforeEnd(this._root.querySelector(":scope > div:last-child > div:last-child"), html);
            this._active = true;

            const gameFilterNode = document.querySelector(".js-pd-game");
            const listNode = document.querySelector(".js-pd-list");
            const imagesNode = document.querySelector(".js-pd-imgs");

            const games = await this._getGamesList(listNode);

            // Show current selection
            if (this._selectedAppid) {
                const game = games.find(([appid]) => appid === this._selectedAppid);
                if (game) {
                    gameFilterNode.value = game[1];
                    this._selectGame(this._selectedAppid, imagesNode);
                }
            }

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

            // Most of this logic is from https://github.com/SteamDatabase/SteamTracking/blob/6db3e47a120c5c938a0ab37186d39b02b14d27d9/steamcommunity.com/public/javascript/global.js#L2726
            gameFilterNode.addEventListener("keyup", () => {

                if (!timer) {
                    timer = TimeUtils.resettableTimer(() => {

                        const searchString = gameFilterNode.value.toLowerCase();
                        const terms = searchString.split(" ").filter(term => term !== "");
                        if (terms.length === 0) {
                            HTML.inner(listNode, "");
                            return;
                        }

                        const regexes = terms.map(term => new RegExp(StringUtils.escapeRegExp(term), "i"));

                        let matchingGames = games.filter(game => {
                            const [, title, safeTitle] = game;
                            let match = true;

                            for (const regex of regexes) {
                                if (!regex.test(safeTitle) && !regex.test(title)) {
                                    match = false;
                                    break;
                                }
                            }

                            if (match) {
                                game.levenshtein = StringUtils.levenshtein(title.trim().toLowerCase(), searchString);
                            }

                            return match;
                        });

                        if (matchingGames.length === 0) {
                            HTML.inner(listNode, "");
                            return;
                        }

                        matchingGames.sort((a, b) => {
                            if (a.levenshtein === b.levenshtein) {
                                return a[1].localeCompare(b[1]);
                            }
                            return a.levenshtein - b.levenshtein;
                        });

                        matchingGames = matchingGames.slice(0, 20);

                        let list = "";
                        for (const [appid, title] of matchingGames) {
                            const selected = this._selectedAppid === appid ? " is-selected" : "";

                            list += `<div class="as-pd__item${selected} js-pd-item" data-appid="${appid}">${title}</div>`;
                        }
                        HTML.inner(listNode, list);
                    }, 200);
                }

                timer.reset();
            });

            document.querySelector(".js-pd-bg-clear").addEventListener("click", async() => {
                if (!this._currentImage && !this._currentAppid) { return; }

                await this.context.clearOwn();

                window.location.href = `${Config.ApiServerHost}/profile/background/delete/v2`;
            });

            document.querySelector(".js-pd-bg-save").addEventListener("click", async() => {
                if (!this._selectedImage || !this._selectedAppid) { return; }
                if (this._selectedImage === this._currentImage && this._selectedAppid === this._currentAppid) { return; }

                await this.context.clearOwn();

                const appid = encodeURIComponent(this._selectedAppid);
                const img = encodeURIComponent(this._selectedImage);
                window.location.href = `${Config.ApiServerHost}/profile/background/save/v2?appid=${appid}&img=${img}`;
            });

        } else if (this._active) {
            document.querySelector(".js-bg-selection")?.remove();
            this._active = false;
        }
    }

    // From https://github.com/SteamDatabase/SteamTracking/blob/6db3e47a120c5c938a0ab37186d39b02b14d27d9/steamcommunity.com/public/javascript/global.js#L2790
    _getSafeString(value) {
        return value.toLowerCase().replace(/[\s.-:!?,']+/g, "");
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

    async _getGamesList(listNode) {

        if (typeof this._games === "undefined") {

            HTML.inner(listNode,
                `<div class="es_loading">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <span>${Localization.str.loading}</span>
                </div>`);

            this._games = await Background.action("profile.background.games");
            for (const game of this._games) {
                game.push(this._getSafeString(game[1]));
            }

            listNode.querySelector(".es_loading").remove();
        }

        return this._games;
    }
}
