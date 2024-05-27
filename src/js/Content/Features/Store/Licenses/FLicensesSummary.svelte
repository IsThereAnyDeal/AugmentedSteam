<script lang="ts">
    import {slide} from "svelte/transition";
    import SmallSteamButton from "../../../Steam/SmallSteamButton.svelte";
    import ToggleIcon from "../../../Steam/ToggleIcon.svelte";
    import {__all, __hide, __show, __thewordunknown, __wl_label, __year} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    const total: Record<string, number> = {};
    const yearly: Record<string, Record<string, number>> = {};

    for (const item of document.querySelectorAll(".account_table tr")) {
        const dateStr = item.querySelector("td.license_date_col")?.textContent?.trim();
        if (!dateStr) { continue; }

        const year = /\d{4}/.exec(dateStr)?.[0] ?? L(__thewordunknown);
        const type = item.querySelector("td.license_acquisition_col")?.textContent?.trim() || L(__thewordunknown);

        total[type] = (total[type] ?? 0) + 1;
        (yearly[year] ??= {})[type] = (yearly[year]![type] ?? 0) + 1;
    }

    let isOpen: boolean = false;
</script>


<div class="stats">
    <h3>
        {L(__wl_label)}
        <SmallSteamButton on:click={() => (isOpen = !isOpen)}>
            {L(isOpen ? __hide : __show)}
            <ToggleIcon down={!isOpen} />
        </SmallSteamButton>
    </h3>

    {#if isOpen}
        <div class="block_content" transition:slide={{axis: "y", duration: 200}}>
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
</style>
