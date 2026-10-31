<script lang="ts">
    import {slide} from "svelte/transition";
    import SmallSteamButton from "../../../Steam/SmallSteamButton.svelte";
    import ToggleIcon from "../../../Steam/ToggleIcon.svelte";
    import {
        __all,
        __error,
        __hide,
        __loading,
        __retry,
        __show,
        __thewordunknown,
        __toomanyrequests,
        __wl_label,
        __year
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import HTML from "@Core/Html/Html";
    import RequestData from "@Content/Modules/RequestData";
    import LocalStorage from "@Core/Storage/LocalStorage";
    import Errors from "@Core/Errors/Errors";

    type TYearly = Record<string, Record<string, number>>;

    interface TCollected {
        yearly: TYearly,
        count: number,
        latest: string|null,
        found: boolean,
        totalCount: number|null
    }

    export let steamId: string;

    const baseUrl = "https://store.steampowered.com/account/licenses/";
    const language = document.documentElement.lang;

    let isOpen: boolean = false;
    let promise: Promise<void>|null = null;
    let loaded: number = 0;
    let totalLicenses: number|null = null;
    let yearly: TYearly = {};

    $: total = Object.values(yearly).reverse().reduce<Record<string, number>>((result, map) => {
        for (const [type, count] of Object.entries(map)) {
            result[type] = (result[type] ?? 0) + count;
        }
        return result;
    }, {});

    function add(target: TYearly, year: string, type: string, count: number): void {
        const map = (target[year] ??= {});
        map[type] = (map[type] ?? 0) + count;
    }

    function getTotalCount(page: ParentNode): number|null {
        const text = page.querySelector(".license_paginator_ctn > span")?.textContent;
        const numbers = text?.match(/\d[\d.,\s]*/g)?.map(n => Number(n.replace(/\D/g, "")));
        return numbers ? Math.max(...numbers) : null;
    }

    function getRowKey(row: Element): string {
        return [
            row.querySelector("td.license_date_col"),
            row.querySelector("td.license_date_col + td"),
            row.querySelector("td.license_acquisition_col")
        ].map(td => td?.textContent?.replace(/\s+/g, " ").trim()).join("|");
    }

    async function getPage(url: string|null): Promise<ParentNode> {
        if (url === null && !new URLSearchParams(window.location.search).has("continuationToken")) {
            return document;
        }
        return HTML.toDom(await RequestData.getText(url ?? baseUrl));
    }

    async function collect(until: string|null): Promise<TCollected> {
        const result: TCollected = {yearly: {}, count: 0, latest: null, found: false, totalCount: null};
        loaded = 0;

        let url: string|null = null;
        do {
            const page = await getPage(url);
            if (url === null) {
                result.totalCount = getTotalCount(page);
                totalLicenses = result.totalCount;
            }

            let rows = 0;
            for (const row of page.querySelectorAll(".account_table tr")) {
                const dateStr = row.querySelector("td.license_date_col")?.textContent?.trim();
                if (!dateStr) { continue; }
                rows++;

                const key = getRowKey(row);
                if (key === until) {
                    result.found = true;
                    return result;
                }
                result.latest ??= key;

                const year = /\d{4}/.exec(dateStr)?.[0] ?? L(__thewordunknown);
                const type = row.querySelector("td.license_acquisition_col")?.textContent?.trim() || L(__thewordunknown);

                add(result.yearly, year, type, 1);
                result.count++;
            }
            loaded = result.count;

            const next = page.querySelector(".license_paginator_next")?.getAttribute("href");
            url = rows > 0 && next ? new URL(next, baseUrl).toString() : null;
        } while (url !== null);

        return result;
    }

    async function load(): Promise<void> {
        const cached = await LocalStorage.get("licenses_summary");
        const cache = cached?.steamId === steamId && cached.language === language ? cached : null;

        let result = await collect(cache?.latest ?? null);
        let count = result.count;

        if (cache && result.found) {
            if (result.totalCount === null || cache.totalCount === null || result.totalCount - cache.totalCount === result.count) {
                for (const [year, map] of Object.entries(cache.yearly)) {
                    for (const [type, n] of Object.entries(map)) {
                        add(result.yearly, year, type, n);
                    }
                }
                count += cache.count;
                result.latest ??= cache.latest;
            } else {
                result = await collect(null);
                count = result.count;
            }
        }

        yearly = result.yearly;

        if (result.latest !== null) {
            await LocalStorage.set("licenses_summary", {steamId, language, latest: result.latest, count, totalCount: result.totalCount, yearly});
        }
    }

    function toggle(): void {
        isOpen = !isOpen;
        if (isOpen && !promise) {
            promise = load();
        }
    }
</script>


<div class="stats">
    <h3>
        {L(__wl_label)}
        <SmallSteamButton on:click={toggle}>
            {L(isOpen ? __hide : __show)}
            <ToggleIcon down={!isOpen} />
        </SmallSteamButton>
    </h3>

    {#if isOpen && promise}
        <div class="block_content" transition:slide={{axis: "y", duration: 200}}>
            {#await promise}
                <div class="status">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="Loading">
                    <span>{L(__loading)} {totalLicenses === null ? loaded : `${loaded} / ${totalLicenses}`}</span>
                </div>
            {:then _}
                <table class="account_table">
                    <thead>
                        <tr>
                            <th>{L(__year)}</th>
                            {#each Object.keys(total) as type}
                                <th>{type}</th>
                            {/each}
                            <th>{L(__all)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each Object.entries(yearly).reverse() as [year, map]}
                            <tr>
                                <td>{year}</td>
                                {#each Object.keys(total) as type}
                                    <td>{map[type] ?? 0}</td>
                                {/each}
                                <td>{Object.values(map).reduce((result, currentValue) => result + currentValue, 0)}</td>
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>{L(__all)}</td>
                            {#each Object.values(total) as count}
                                <td>{count}</td>
                            {/each}
                            <td>{Object.values(total).reduce((result, currentValue) => result + currentValue, 0)}</td>
                        </tr>
                    </tfoot>
                </table>
            {:catch e}
                <div class="status">
                    {L(e instanceof Errors.HTTPError && e.code === 429 ? __toomanyrequests : __error)}
                    <SmallSteamButton on:click={() => (promise = load())}>
                        {L(__retry)}
                    </SmallSteamButton>
                </div>
            {/await}
        </div>
    {/if}
</div>


<style>
    .stats {
        margin-bottom: 20px;
    }

    h3 {
        color: #ffffff;
        font-size: 22px;
        font-family: "Motiva Sans", Sans-serif;
        font-weight: normal;
        text-transform: uppercase;
        display: flex;
        gap: 5px;
        justify-content: flex-start;
        align-items: baseline;
    }

    .status {
        display: flex;
        align-items: center;
        gap: 10px;
    }
</style>
