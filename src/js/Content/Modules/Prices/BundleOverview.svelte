<svelte:options immutable={true} />

<script lang="ts">
    import type {TBundle, TPrice} from "./_types";
    import {Localization} from "../../../Core/Localization/Localization";
    import {onMount} from "svelte";
    import {Price} from "../Price";
    import {CurrencyManager} from "../CurrencyManager";

    export let data: TBundle[];

    function getPrice(price: TPrice): Price {
        let tierPrice = new Price(price.amount, price.currency);
        try {
            tierPrice = tierPrice.inCurrency(CurrencyManager.customCurrency);
        } catch (err) {
            console.warn("Could not convert currency, using country currency");
        }
        return tierPrice;
    }

    let appName: string|null;

    function getBundlePrice(bundle: TBundle): TPrice|null {
        return bundle.tiers
            .find(tier => tier.games.find(game => game.title === appName))
            ?.price ?? null;
    }

    onMount(() => {
        appName = document.querySelector(".apphub_AppName")?.textContent ?? null;
    });
</script>

{#if data.length > 0}
    <h2 class="gradientbg es_external_icon">{Localization.str.bundle.header}</h2>

    {#each data as bundle}
        {@const expiry = bundle.expiry ? new Date(bundle.expiry) : null}
        {#if expiry === null || expiry.valueOf() > Date.now()}
            {@const bundlePrice = getBundlePrice(bundle)}

            <div class="game_area_purchase_game">
                <div class="game_area_purchase_platform"></div>
                <h1>{Localization.str.buy_package.replace("__package__", `${bundle.page.name} ${bundle.title}`)}</h1>

                {#if expiry}
                    <p class="game_purchase_discount_countdown">
                        {Localization.str.bundle.offer_ends}
                        {expiry.toLocaleDateString()}
                    </p>
                {/if}

                <p class="package_contents">
                    {#each bundle.tiers as tier, num}
                        <b>
                            {#if bundle.tiers.length > 1}
                                {Localization.str.bundle.tier_includes
                                    .replace("__tier__", Localization.str.bundle.tier.replace("__num__", num+1))
                                    .replace("__price__", tier.price ? getPrice(tier.price).toString() : "")
                                    .replace("__num__", tier.games.length)}:
                            {:else}
                                {Localization.str.bundle.includes.replace("__num__", tier.games.length)}:
                            {/if}
                        </b>
                        {#each tier.games as game, index}<!--
                            -->{#if index !== 0}, {/if}
                            <span class:highlight={appName === game.title}>{game.title}</span><!--
                        -->{/each}
                        <br />
                    {/each}
                </p>

                <div class="game_purchase_action">
                    <div class="game_purchase_action_bg">
                        <div class="btn_addtocart btn_packageinfo">
                            <a class="btn_blue_steamui btn_medium" href={bundle.details} target="_blank">
                                <span>{Localization.str.bundle.info}</span>
                            </a>
                        </div>
                    </div>
                    <div class="game_purchase_action_bg">

                        {#if bundlePrice}
                            <div class="game_purchase_price price" itemprop="price">
                                {getPrice(bundlePrice).toString()}
                            </div>
                        {/if}

                        <div class="btn_addtocart">
                            <a class="btn_green_steamui btn_medium" href={bundle.url} target="_blank">
                                <span>{Localization.str.buy}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/each}
{/if}

<style>
    .highlight {
        text-decoration: underline;
    }
</style>
