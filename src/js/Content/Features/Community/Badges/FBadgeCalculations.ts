import AppId from "@Core/GameId/AppId";
import {
    __badgeCompletionAvg,
    __cardDropsRemaining,
    __dropCalc,
    __dropsWorthAvg,
    __gamesWithBooster,
    __gamesWithDrops,
    __loading,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CBadges from "@Content/Features/Community/Badges/CBadges";
import HTML from "@Core/Html/Html";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import Price from "@Content/Modules/Currency/Price";
import DOMHelper from "@Content/Modules/DOMHelper";
import RequestData from "@Content/Modules/RequestData";

export default class FBadgeCalculations extends Feature<CBadges> {

    private _dropsCount: number = 0;
    private _dropsGames: number = 0;
    private _totalWorth: number = 0;

    override checkPrerequisites(): boolean {
        return this.context.myProfile;
    }

    override apply(): void {
        this._dropsCount = 0;
        this._dropsGames = 0;
        this._totalWorth = 0;

        this._updateHead();
        this._addCalculations();
    }

    _updateHead() {

        const xpBlockRight = document.querySelector(".profile_xp_block_right");
        if (!xpBlockRight) {
            return;
        }

        // Move FAQ to the middle
        HTML.beforeEnd(
            document.querySelector(".profile_xp_block_mid"),
            `<div class="es_faq_cards">${xpBlockRight.innerHTML}</div>`
        );
        HTML.inner(
            xpBlockRight,
            '<div id="es_cards_worth"></div>'
        );
    }

    async _addCalculations(): Promise<void> {

        if (this.context.hasMultiplePages) {

            let completed = false;

            HTML.afterBegin(".profile_xp_block_right",
                `<div id="es_calculations">
                    <div class="btn_grey_black btn_small_thin">
                        <span>${L(__dropCalc)}</span>
                    </div>
                </div>`);

            await this._countFromDOM();

            document.querySelector("#es_calculations")!.addEventListener("click", async() => {
                if (completed) { return; }

                document.querySelector("#es_calculations")!.textContent = L(__loading);

                for await (let [dom, images_] of this.context.eachBadgePage()) {
                    this._countFromDOM(dom);
                }

                this._addData();
                completed = true;
            });

        } else {
            HTML.afterBegin(".profile_xp_block_right", `<div id="es_calculations">${L(__loading)}</div>`);

            await this._countFromDOM();
            this._addData();
        }
    }

    _countFromDOM(dom: DocumentFragment|Document = document): void {
        this._countDropsFromDOM(dom);
        this._countWorthFromDOM(dom);
    }

    async _countWorthFromDOM(dom: DocumentFragment|Document): Promise<void> {

        const nodes: [number, HTMLElement, boolean][] = [];
        const appids: number[] = [];
        const foilAppids: number[] = [];

        for (const node of dom.querySelectorAll<HTMLElement>(".badge_row.is_link")) {
            const linkNode = node.querySelector<HTMLAnchorElement>(".badge_row_overlay")
            if (!linkNode) {
                continue;
            }
            const link = linkNode.href;

            const appid = AppId.fromGameCardUrl(link);
            if (!appid) { continue; }

            const foil = new URL(link).searchParams.has("border");
            if (foil) {
                foilAppids.push(appid);
            } else {
                appids.push(appid);
            }

            nodes.push([appid, node, foil]);
        }

        if (appids.length === 0 && foilAppids.length === 0) {
            return;
        }

        let data;
        try {
            data = await AugmentedSteamApiFacade.fetchMarketCardAveragePrices(
                CurrencyManager.storeCurrency,
                [...appids, ...foilAppids]
            );
        } catch (e) {
            console.error("Failed to retrieve average card prices", e);
            return;
        }

        for (const [appid, node, isFoil] of nodes) {

            let cost, worth;
            const averagePrice = isFoil
                ? data[appid]?.foil
                : data[appid]?.regular;

            if (averagePrice === undefined) {
                continue;
            }

            const progressInfoNode = node.querySelector(".badge_progress_info");
            if (progressInfoNode) {
                const card = progressInfoNode.textContent!.match(/(\d+)\D*(\d+)/);
                if (card) {
                    const need = Number(card[2]) - Number(card[1]);
                    cost = new Price(averagePrice * need);
                }
            }

            // Foil badges have a remaining drops count of 0, their regular badge counterpart tracks them
            if (!isFoil) {
                worth = this._getRemainingDropsWorth(node, averagePrice);
                this._totalWorth += worth;
            }

            if (dom !== document) {
                continue;
            }

            if (worth) {
                HTML.afterEnd(node.querySelector(".progress_info_bold"),
                    `<span data-es-card-worth="${worth.toFixed(2)}">
                        (${L(__dropsWorthAvg)} ${new Price(worth)})
                    </span>`);
            }

            if (cost) {
                const badgeNameBox = DOMHelper.selectLastNode(node, ".badge_empty_name");
                if (badgeNameBox) {
                    HTML.afterEnd(badgeNameBox,
                        `<div class="badge_info_unlocked">
                            ${L(__badgeCompletionAvg, {"cost": String(cost)})}
                        </div>`);
                }
            }

            node.classList.add("esi-badge");
        }
    }

    _countDropsFromDOM(dom: DocumentFragment|Document): void {

        // The selector must be more specific here to prevent matching other progress info like "x of y tasks completed"
        for (const node of dom.querySelectorAll(".badge_title_stats_drops .progress_info_bold")) {
            const count = node.textContent!.match(/\d+/);
            if (!count) { continue; }

            this._dropsGames++;
            this._dropsCount += Number(count[0]);
        }
    }

    async _addData() {

        HTML.inner(
            "#es_calculations",
            `${L(__cardDropsRemaining, {"drops": this._dropsCount})}
            <br>
            ${L(__gamesWithDrops, {"dropsgames": this._dropsGames})}`
        );

        document.querySelector("#es_cards_worth")!.textContent = `${L(__dropsWorthAvg)} ${new Price(this._totalWorth)}`;

        let response;
        try {
            response = await RequestData.getText("https://steamcommunity.com/my/ajaxgetboostereligibility/");
        } catch (err) {
            console.error("Failed to load booster eligibility", err);
            return;
        }

        const dummyPage = HTML.toDom(response);
        const boosterCount = dummyPage.querySelectorAll(".booster_eligibility_game").length;

        HTML.beforeEnd("#es_calculations", `<br>${L(__gamesWithBooster, {"boostergames": boosterCount})}`);
    }

    _getRemainingDropsWorth(node: Element, averagePrice: number) {

        const progressBoldNode = node.querySelector(".progress_info_bold");
        if (!progressBoldNode) {
            return 0;
        }

        const drops = progressBoldNode.textContent!.match(/\d+/);
        if (!drops) {
            return 0;
        }

        const worth = Number(drops[0]) * averagePrice;
        if (worth < 0) {
            return 0;
        }

        return worth;
    }
}
