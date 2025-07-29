<script lang="ts">

    import {L} from "@Core/Localization/Localization";
    import {
        __error,
        __loading,
        __loadMarketStats,
        __marketTransactions,
        __netGain,
        __netSpent,
        __purchaseTotal,
        __retry,
        __salesTotal,
        __toomanyrequests
    } from "@Strings/_strings";
    import LocalStorage from "@Core/Storage/LocalStorage";
    import Price from "@Content/Modules/Currency/Price";
    import RequestData from "@Content/Modules/RequestData";
    import Errors from "@Core/Errors/Errors";
    import {onMount} from "svelte";

    const enum EventType {
        Sell = 3,
        Buy = 4
    }

    interface TEvent {
        listingid: string,
        purchaseid: string,
        event_type: EventType
    }

    interface TMarketPage {
        success: boolean,
        pagesize: number,
        total_count: number,
        start: number,
        events: Array<TEvent>
        purchases: Record<string, {
            paid_amount: number,
            paid_fee: number,
            currencyid: string,
            received_amount: number,
            received_currencyid: string
        }>
    }

    export let loadOnMount: boolean = false;

    let promise: Promise<void>|null = null;
    let totalEvents: number = 0;

    let latestId: string|null = null;
    let events: number = 0;
    let buyTotal: number = 0;
    let sellTotal: number = 0;

    async function fetchPage(start: number, pagesize: number): Promise<TMarketPage> {
        const url = "https://steamcommunity.com/market/myhistory/render/?"+(new URLSearchParams({
            count: String(pagesize),
            start: String(start),
            norender: "1"
        }));

        const data = await RequestData.getJson<TMarketPage>(url.toString());
        if (!data.success) {
            throw new Error();
        }
        return data;
    }

    function getEventId(event: TEvent): string {
        return `${event.listingid}_${event.purchaseid}`;
    }

    function parsePage(page: TMarketPage, untilEvent: string|null): void {
        for (const event of page.events) {
            const id = getEventId(event);
            if (id === untilEvent) {
                break;
            }

            const type = event.event_type;
            const purchase = page.purchases[id]!;

            if (type === EventType.Buy) {
                buyTotal += purchase.paid_amount + purchase.paid_fee;
                events += 1;
            } else if (type === EventType.Sell) {
                sellTotal += purchase.received_amount;
                events += 1;
            } else {
                // what is this?
            }
        }

        if (page.events.length > 0) {
            latestId = getEventId(page.events[0]!);
        }
    }

    /**
     * I will make assumptions here
     */
    async function load(): Promise<void> {
        // @ts-expect-error
        LocalStorage.remove("market_stats"); // old entry, remove after some time

        const cached = await LocalStorage.get("market_stats2");
        let cachedEventId = null;
        let cachedEvents = 0;
        if (cached) {
            cachedEventId = cached.eventId;
            cachedEvents = cached.events;
            events = cachedEvents;
            buyTotal = cached.buyTotal;
            sellTotal = cached.sellTotal;
        }

        const pageSize = 500;
        const firstPage = await fetchPage(0, pageSize);
        totalEvents = firstPage.total_count;

        let error: any|null = null;
        try {
            if (!cachedEventId || !(cachedEventId in firstPage.purchases)) {
                const total = firstPage.total_count;
                if (total >= pageSize) {
                    const pages = Math.ceil((total - cachedEvents) / pageSize);
                    for (let p = pages-1; p >= 1; p--) {
                        const page = await fetchPage(p * pageSize, pageSize);
                        parsePage(page, cachedEventId)
                    }
                }
            }

            if (!error) {
                parsePage(firstPage, cachedEventId);
            }
        } catch (e) {
            console.error(e);
            // stop on error, cache what we have, allow restart
            error = e;
        }

        if (latestId !== null) {
            await LocalStorage.set("market_stats2", {eventId: latestId, events, buyTotal, sellTotal});
        }

        if (error) {
            throw error;
        }
    }

    function getPrice(amount: number): Price {
        return new Price(amount/100);
    }

    onMount(() => {
        if (loadOnMount) {
            promise = load();
        }
    });
</script>


<div id="es_summary">
    <div class="market_search_sidebar_contents">
        <h2 class="market_section_title">{L(__marketTransactions)}</h2>
        {#if !promise}
            <div id="es_market_summary_status">
                <button type="button" class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button"
                        on:click={() => promise = load()}>
                    <span>{L(__loadMarketStats)}</span>
                </button>
            </div>
        {:else}
            {#await promise}
                <div id="es_market_summary_status">
                    <img id="es_market_summary_throbber" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="Loading">
                    <span>
                        <span id="esi_market_stats_progress_description">{L(__loading)} </span>
                    </span>
                </div>
            {:then _}
                <!-- empty -->
            {:catch e}
                <div class="error">
                    {L(e instanceof Errors.HTTPError && e.code === 429 ? __toomanyrequests : __error)}

                    <button type="button" class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button"
                            on:click={() => promise = load()}>
                        <span>{L(__retry)}</span>
                    </button>
                </div>
            {/await}

            <div class="market_search_game_button_group" id="es_market_summary">
                <div>
                    {L(__purchaseTotal)}
                    <span class="es_market_summary_item">{getPrice(buyTotal)}</span>
                </div>
                <div>
                    {L(__salesTotal)}
                    <span class="es_market_summary_item">{getPrice(sellTotal)}</span>
                </div>
                <div>
                    {L(buyTotal < sellTotal ? __netGain : __netSpent)}
                    <span class="es_market_summary_item" style:color={buyTotal <= sellTotal ? "green" : "red"}>
                        {getPrice(sellTotal - buyTotal)}
                    </span>
                </div>
            </div>
            {#if events !== totalEvents}
                <div class="load-progress">{events} / {totalEvents}</div>
            {/if}
        {/if}
    </div>
</div>


<style>
    #es_market_summary_status {
        display: flex;
        align-items: center;
    }
    #es_market_summary_status img {
        margin-right: 10px;
    }
    .es_market_summary_item {
        float: right;
        vertical-align: top;
        line-height: inherit;
        margin-left: 5px;
    }

    .load-progress {
        font-size: 0.75em;
        text-align: right;
    }

    .error {
        display: flex;
        justify-content: space-between;
    }
</style>