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

    private active: boolean = false;
    private currentImage: string = "";
    private currentAppid: number = 0;
    private selectedImage: string = "";
    private selectedAppid: number = 0;
    private games: Array<{
        appid: number,
        title: string,
        safeTitle: string,
        levenshtein: number
    }>|undefined = undefined;

    override async checkPrerequisites(): Promise<boolean> {

        const result = await this.context.data;
        if (!result) { return false; }

        const {img, appid} = result.bg || {};

        this.currentImage = img || "";
        this.currentAppid = appid ?? 0;
        this.selectedImage = this.currentImage;
        this.selectedAppid = this.currentAppid;
        return true;
    }

    override apply(): void {
        document.addEventListener("as_profileNav", () => this.callback());
        this.callback();
    }

    private async callback() {
        if (!document.querySelector('[href$="/edit/background"].active')) {
            document.querySelector(".js-bg-selection")?.remove();
            this.active = false;
            return;
        }

        if (this.active) { return; }
        this.active = true;

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

        HTML.beforeEnd(this.context.root!.querySelector(":scope > div:last-child > div:last-child"), html);

        const gameFilterNode = document.querySelector<HTMLInputElement>(".js-pd-game")!;
        const listNode = document.querySelector<HTMLElement>(".js-pd-list")!;
        const imagesNode = document.querySelector<HTMLElement>(".js-pd-imgs")!;

        const games = await this.getGamesList(listNode);

        // Show current selection
        if (this.selectedAppid) {
            const game = games.find(({appid}) => appid === this.selectedAppid);
            if (game) {
                gameFilterNode.value = game.title;
                this.selectGame(this.selectedAppid, imagesNode);
            }
        }

        listNode.addEventListener("click", ({target}) => {
            const appid = Number((<HTMLElement>target).dataset.appid ?? 0);
            if (!appid || appid === this.selectedAppid) { return; }

            this.selectedImage = ""; // Clear current selection so selected image and appid remain in sync
            this.selectGame(appid, imagesNode);

            document.querySelector(".js-pd-item.is-selected")?.classList.remove("is-selected");
            (<HTMLElement>target).classList.add("is-selected");
        });

        imagesNode.addEventListener("click", ({target}) => {
            const node = (<HTMLElement>target).closest<HTMLElement>(".js-pd-img");
            if (!node || node.dataset.img === this.selectedImage) { return; }

            this.selectedImage = node.dataset.img ?? "";

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
                        const selected = this.selectedAppid === appid ? " is-selected" : "";

                        list += `<div class="as-pd__item${selected} js-pd-item" data-appid="${appid}">${title}</div>`;
                    }
                    HTML.inner(listNode, list);
                }, 200);
            }

            timer.reset();
        });

        document.querySelector(".js-pd-bg-clear")!.addEventListener("click", async() => {
            if (!this.currentImage && !this.currentAppid) { return; }

            await AugmentedSteamApiFacade.clearOwn(this.context.steamId);

            window.location.href = `${Config.ApiServerHost}/profile/background/delete/v2`;
        });

        document.querySelector(".js-pd-bg-save")!.addEventListener("click", async() => {
            if (!this.selectedImage || !this.selectedAppid) { return; }
            if (this.selectedImage === this.currentImage && this.selectedAppid === this.currentAppid) { return; }

            await AugmentedSteamApiFacade.clearOwn(this.context.steamId);

            const appid = encodeURIComponent(this.selectedAppid);
            const img = encodeURIComponent(this.selectedImage);
            window.location.href = `${Config.ApiServerHost}/profile/background/save/v2?appid=${appid}&img=${img}`;
        });
    }

    // From https://github.com/SteamDatabase/SteamTracking/blob/6db3e47a120c5c938a0ab37186d39b02b14d27d9/steamcommunity.com/public/javascript/global.js#L2790
    private getSafeString(value: string): string {
        return value.toLowerCase().replace(/[\s.-:!?,']+/g, "");
    }

    private async selectGame(appid: number, imagesNode: HTMLElement): Promise<void> {

        this.selectedAppid = appid;
        let images = "";

        const result = await AugmentedSteamApiFacade.fetchProfileBackground(appid);
        for (const [url, title] of result) {
            const selected = this.selectedImage === url ? " is-selected" : "";

            images
                += `<div class="as-pd__item${selected} js-pd-img" data-img="${url}">
                        <img src="${this.getImageUrl(url)}" class="as-pd__img">
                        <div>${title}</div>
                    </div>`;
        }

        HTML.inner(imagesNode, images);
    }

    private getImageUrl(name: string): string {
        return `https://steamcommunity.com/economy/image/${name}/622x349`;
    }

    private async getGamesList(listNode: HTMLElement) {

        if (this.games === undefined) {

            HTML.inner(listNode,
                `<div class="es_loading">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <span>${L(__loading)}</span>
                </div>`);


            const games = await AugmentedSteamApiFacade.fetchProfileBackgroundGames();
            this.games = [];
            for (const game of games) {
                this.games.push({
                    appid: game[0],
                    title: game[1],
                    safeTitle: this.getSafeString(game[1]),
                    levenshtein: 0
                });
            }

            listNode.querySelector(".es_loading")?.remove();
        }

        return this.games;
    }
}
