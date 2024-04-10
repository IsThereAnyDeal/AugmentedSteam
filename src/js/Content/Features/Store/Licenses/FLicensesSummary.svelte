<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FLicensesSummary.svelte";
    import {Feature} from "../../../modulesContent";
    import type {CLicenses} from "./CLicenses";

    export class FLicensesSummary extends Feature<CLicenses> {

        override apply(): void {
            let target = document.querySelector(".youraccount_page");
            if (!target) {
                throw new Error("Node not found");
            }

            (new self_({
                target,
                anchor: target.firstElementChild,
            }));
        }
    }
</script>

<script lang="js">
    import {Localization} from "../../../../modulesCore";

    const list = {};
    const types = {};

    for (const item of document.querySelectorAll(".account_table tr")) {
        const dateStr = item.querySelector("td.license_date_col")?.textContent.trim();
        if (!dateStr) { continue; }

        const year = /\d{4}/.exec(dateStr)?.[0] ?? Localization.str.thewordunknown;
        const type = item.querySelector("td.license_acquisition_col")?.textContent.trim() || Localization.str.thewordunknown;

        (list[year] ??= {})[type] = (list[year][type] ?? 0) + 1;
        types[type] = (types[type] ?? 0) + 1;
    }

    const listEntries = Object.entries(list).reverse();
    const totals = listEntries.map(
        ([, row]) => Object.entries(row)
            .map(([, count]) => count)
            .reduce((a, b) => a + b, 0)
    );

    const totalGlobal = totals.reduce((a, b) => a + b, 0);
    const typesEntries = Object.entries(types);

    const tableHeader = typesEntries
        .map(([name]) => `<th>${name}</th>`)
        .join("");

    const tableFooter = typesEntries
        .map(([, value]) => `<td>${value || "0"}</td>`)
        .join("");

    const rows = listEntries
        .map(([year, row], i) => `<tr>
            <td>${year}</td>
            ${typesEntries
                .map(([name]) => `<td>${row[name] || "0"}</td>`)
                .join("")
            }
            <td>${totals[i] || "0"}</td>
        </tr>`)
        .join("");

    let show = false;
</script>

<span class="h3">{Localization.str.wl.label}</span>
<button on:click={() => (show = !show)}>{show ? Localization.str.hide : Localization.str.show}</button>
{#if show}
<div class="block_content">
    <table class="account_table">
        <thead>
            <tr>
                <th>{Localization.str.year}</th>
                {@html tableHeader}
                <th>{Localization.str.all}</th>
            </tr>
        </thead>
        <tbody>
            {@html rows}
        </tbody>
        <tfoot>
            <tr>
                <td>{Localization.str.all}</td>
                {@html tableFooter}
                <td>{totalGlobal}</td>
            </tr>
        </tfoot>
    </table>
</div>
{/if}


<style>
    :global(.block) {
        margin-top: 20px;
    }
    .h3 {
        color: #ffffff;
        font-size: 22px;
        font-family: "Motiva Sans", Sans-serif;
        font-weight: normal;
        text-transform: uppercase;
    }
    button {
        vertical-align: text-bottom;
        margin-left: 5px;
        cursor: pointer;
        border: solid #8ecafc 1px;
        padding: 0px 10px;
    }
</style>
