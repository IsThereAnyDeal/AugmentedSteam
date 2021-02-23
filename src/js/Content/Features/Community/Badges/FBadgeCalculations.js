import {HTML, Localization} from "../../../../modulesCore";
import {Background, CommunityUtils, CurrencyManager, DOMHelper, Feature, Price, RequestData} from "../../../modulesContent";

export default class FBadgeCalculations extends Feature {

    checkPrerequisites() {
        return CommunityUtils.currentUserIsOwner();
    }

    apply() {
        this._dropsCount = 0;
        this._dropsGames = 0;
        this._totalWorth = 0;

        this._updateHead();
        this._addCalculations();
    }

    _updateHead() {

        // Move FAQ to the middle
        const xpBlockRight = document.querySelector(".profile_xp_block_right");

        HTML.beforeEnd(
            document.querySelector(".profile_xp_block_mid"),
            `<div class="es_faq_cards">${xpBlockRight.innerHTML}</div>`
        );
        xpBlockRight.innerHTML = "<div id='es_cards_worth'></div>";
    }

    async _addCalculations() {

        if (this.context.hasMultiplePages) {

            let completed = false;

            HTML.afterBegin(".profile_xp_block_right",
                `<div id="es_calculations">
                    <div class="btn_grey_black btn_small_thin">
                        <span>${Localization.str.drop_calc}</span>
                    </div>
                </div>`);

            await this._countFromDOM();

            document.querySelector("#es_calculations").addEventListener("click", async() => {
                if (completed) { return; }

                document.querySelector("#es_calculations").textContent = Localization.str.loading;

                await this.context.eachBadgePage(dom => this._countFromDOM(dom));

                this._addData();
                completed = true;
            });

        } else {
            HTML.afterBegin(".profile_xp_block_right",
                `<div id="es_calculations">${Localization.str.drop_calc}</div>`);

            await this._countFromDOM();
            this._addData();
        }
    }

    _countFromDOM(dom = document) {
        this._countDropsFromDOM(dom);
        return this._countWorthFromDOM(dom);
    }

    async _countWorthFromDOM(dom) {

        const appids = [];
        const nodes = [];
        const foilAppids = [];

        const rows = dom.querySelectorAll(".badge_row.is_link");
        for (const node of rows) {
            const game = node.querySelector(".badge_row_overlay").href.match(/gamecards\/(\d+)\//);
            if (!game) { continue; }

            const appid = parseInt(game[1]);

            const foil = /\?border=1/.test(node.querySelector("a:last-of-type").href);
            nodes.push([appid, node, foil]);

            if (foil) {
                foilAppids.push(appid);
            } else {
                appids.push(appid);
            }
        }

        if (appids.length === 0 && foilAppids.length === 0) {
            return;
        }

        let data;
        try {
            data = await Background.action("market.averagecardprices", {
                "currency": CurrencyManager.storeCurrency,
                "appids": appids.join(","),
                "foilappids": foilAppids.join(","),
            });
        } catch (exception) {
            console.error("Couldn't retrieve average card prices", exception);
            return;
        }

        for (const [appid, node, isFoil] of nodes) {

            let cost, worth;
            const key = isFoil ? "foil" : "regular";

            if (!data[appid] || !data[appid][key]) { continue; }

            const averagePrice = data[appid][key].average;

            const progressInfoNode = node.querySelector("div.badge_progress_info");
            if (progressInfoNode) {
                const card = progressInfoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                if (card) {
                    const need = card[2] - card[1];
                    cost = new Price(averagePrice * need);
                }
            }

            // Foil badges have a remaining drops count of 0, their regular badge counterpart tracks them
            if (!isFoil) {
                worth = this._getRemainingDropsWorth(node, averagePrice);
                this._totalWorth += worth;
            }

            if (dom !== document) { continue; }

            if (worth) {
                HTML.replace(
                    node.querySelector(".how_to_get_card_drops"),
                    `<span class="es_card_drop_worth" data-es-card-worth="${worth}">${Localization.str.drops_worth_avg} ${new Price(worth)}</span>`
                );
            }

            if (cost) {
                const badgeNameBox = DOMHelper.selectLastNode(node, ".badge_empty_name");
                if (badgeNameBox) {
                    HTML.afterEnd(
                        badgeNameBox,
                        `<div class="badge_info_unlocked">
                            ${Localization.str.badge_completion_avg.replace("__cost__", cost)}
                        </div>`
                    );
                }
            }

            node.classList.add("esi-badge");
        }
    }

    _countDropsFromDOM(dom) {

        for (const node of dom.querySelectorAll(".badge_title_stats_drops .progress_info_bold")) {
            const count = node.innerText.match(/(\d+)/);
            if (!count) { continue; }

            this._dropsGames++;
            this._dropsCount += Number(count[1]);
        }
    }

    async _addData() {
        HTML.inner(
            "#es_calculations",
            `${Localization.str.card_drops_remaining.replace("__drops__", this._dropsCount)}
            <br>
            ${Localization.str.games_with_drops.replace("__dropsgames__", this._dropsGames)}`
        );

        document.querySelector("#es_cards_worth").innerText = `${Localization.str.drops_worth_avg} ${new Price(this._totalWorth)}`;

        let response;
        try {
            response = await RequestData.getHttp("https://steamcommunity.com/my/ajaxgetboostereligibility/");
        } catch (exception) {
            console.error("Failed to load booster eligibility", exception);
            return;
        }

        const boosterGames = response.match(/class="booster_eligibility_game"/g);
        const boosterCount = (boosterGames && boosterGames.length) || 0;

        HTML.beforeEnd("#es_calculations",
            `<br>${Localization.str.games_with_booster.replace("__boostergames__", boosterCount)}`);
    }

    _getRemainingDropsWorth(node, averagePrice) {

        const progressBoldNode = node.querySelector(".progress_info_bold");
        if (!progressBoldNode) { return 0; }

        const drops = progressBoldNode.textContent.match(/\d+/);
        if (!drops) { return 0; }

        const worth = drops[0] * averagePrice;
        if (worth < 0) { return 0; }

        return worth;
    }
}
