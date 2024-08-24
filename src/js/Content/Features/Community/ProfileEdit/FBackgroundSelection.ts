import HTML from "@Core/Html/Html";
import StringUtils from "@Core/Utils/StringUtils";
import TimeUtils from "@Core/Utils/TimeUtils";
import type {IResettableTimer} from "@Core/Utils/TimeUtils";
import {
    __customBackground,
    __customBackgroundHelp,
    __gameName,
    __loading,
    __save,
    __thewordclear,
} from "@Strings/_strings";
import Config from "config";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileEdit from "@Content/Features/Community/ProfileEdit/CProfileEdit";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";

export default class FBackgroundSelection extends Feature<CProfileEdit> {

    private _currentImage: string = "";
    private _currentAppid: number = 0;
    private _selectedImage: string = "";
    private _selectedAppid: number = 0;
    private _active: boolean = false;
    private _root: HTMLElement|null = null;
    private _games: Array<{
        appid: number,
        title: string,
        safeTitle: string,
        levenshtein: number
    }>|undefined = undefined;

    override async checkPrerequisites(): Promise<boolean> {

        const result = await this.context.data;
        if (!result) { return false; }

        const {img, appid} = result.bg || {};

        this._currentImage = img || "";
        this._currentAppid = appid ?? 0;
        this._selectedImage = this._currentImage;
        this._selectedAppid = this._currentAppid;
        return true;
    }

    apply() {

        this._active = false;
        this._root = document.querySelector<HTMLElement>("#react_root");

        this._checkPage();

        new MutationObserver(() => { this._checkPage(); })
            .observe(this._root!, {"childList": true, "subtree": true});
    }

    async _checkPage() {

        const html
            = `<div class="js-bg-selection as-pd">

                <div class="DialogLabel as-pd__head" data-tooltip-text="${L(__customBackgroundHelp)}">
                    ${L(__customBackground)} <span class="as-pd__help">(?)</span>
                </div>

                <div class="DialogInput_Wrapper _DialogLayout">
                    <input type="text" class="DialogInput DialogInputPlaceholder DialogTextInputBase js-pd-game" value="" placeholder="${L(__gameName)}">
                </div>

                <div class="as-pd__cnt">
                    <div class="as-pd__list js-pd-list"></div>
                </div>

                <div class="as-pd__cnt">
                    <div class="as-pd__imgs js-pd-imgs"></div>
                </div>

                <div class="as-pd__buttons">
                    <button class="DialogButton _DialogLayout Secondary as-pd__btn js-pd-bg-clear">${L(__thewordclear)}</button>
                    <button class="DialogButton _DialogLayout Primary as-pd__btn js-pd-bg-save">${L(__save)}</button>
                </div>
            </div>`;

        if (document.querySelector('[href$="/edit/background"].active')) {

            if (this._active) { return; } // Happens because the below code will trigger the observer again

            HTML.beforeEnd(this._root!.querySelector(":scope > div:last-child > div:last-child"), html);
            this._active = true;

            const gameFilterNode = document.querySelector<HTMLInputElement>(".js-pd-game");
            const listNode = document.querySelector<HTMLElement>(".js-pd-list");
            const imagesNode = document.querySelector<HTMLElement>(".js-pd-imgs");

            if (!gameFilterNode || !listNode || !imagesNode) {
                return;
            }

            const games = await this._getGamesList(listNode);

            // Show current selection
            if (this._selectedAppid) {
                const game = games.find(({appid}) => appid === this._selectedAppid);
                if (game) {
                    gameFilterNode.value = game.title;
                    this._selectGame(this._selectedAppid, imagesNode);
                }
            }

            listNode.addEventListener("click", ({target}) => {
                const appid = Number((<HTMLElement>target).dataset.appid ?? 0);
                if (!appid || appid === this._selectedAppid) { return; }

                this._selectedImage = ""; // Clear current selection so selected image and appid remain in sync
                this._selectGame(appid, imagesNode);

                document.querySelector(".js-pd-item.is-selected")?.classList.remove("is-selected");
                (<HTMLElement>target).classList.add("is-selected");
            });

            imagesNode.addEventListener("click", ({target}) => {
                const node = (<HTMLElement>target).closest<HTMLElement>(".js-pd-img");
                if (!node || node.dataset.img === this._selectedImage) { return; }

                this._selectedImage = node.dataset.img ?? "";

                document.querySelector(".js-pd-img.is-selected")?.classList.remove("is-selected");
                node.classList.add("is-selected");
            });

            let timer: IResettableTimer|null = null;

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
                            const {title, safeTitle} = game;
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
                                return a.title.localeCompare(b.title);
                            }
                            return a.levenshtein - b.levenshtein;
                        });

                        matchingGames = matchingGames.slice(0, 20);

                        let list = "";
                        for (const {appid, title} of matchingGames) {
                            const selected = this._selectedAppid === appid ? " is-selected" : "";

                            list += `<div class="as-pd__item${selected} js-pd-item" data-appid="${appid}">${title}</div>`;
                        }
                        HTML.inner(listNode, list);
                    }, 200);
                }

                timer.reset();
            });

            document.querySelector(".js-pd-bg-clear")!.addEventListener("click", async() => {
                if (!this._currentImage && !this._currentAppid) { return; }

                await AugmentedSteamApiFacade.clearOwn(this.context.steamId);

                window.location.href = `${Config.ApiServerHost}/profile/background/delete/v2`;
            });

            document.querySelector(".js-pd-bg-save")!.addEventListener("click", async() => {
                if (!this._selectedImage || !this._selectedAppid) { return; }
                if (this._selectedImage === this._currentImage && this._selectedAppid === this._currentAppid) { return; }

                await AugmentedSteamApiFacade.clearOwn(this.context.steamId);

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
    _getSafeString(value: string): string {
        return value.toLowerCase().replace(/[\s.-:!?,']+/g, "");
    }

    async _selectGame(appid: number, imagesNode: HTMLElement): Promise<void> {

        this._selectedAppid = appid;
        let images = "";

        const result = await AugmentedSteamApiFacade.fetchProfileBackground(appid);
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

    _getImageUrl(name: string): string {
        return `https://steamcommunity.com/economy/image/${name}/622x349`;
    }

    async _getGamesList(listNode: HTMLElement) {

        if (this._games === undefined) {

            HTML.inner(listNode,
                `<div class="es_loading">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <span>${L(__loading)}</span>
                </div>`);


            const games = await AugmentedSteamApiFacade.fetchProfileBackgroundGames();
            this._games = [];
            for (const game of games) {
                this._games.push({
                    appid: game[0],
                    title: game[1],
                    safeTitle: this._getSafeString(game[1]),
                    levenshtein: 0
                });
            }

            listNode.querySelector(".es_loading")?.remove();
        }

        return this._games;
    }
}
