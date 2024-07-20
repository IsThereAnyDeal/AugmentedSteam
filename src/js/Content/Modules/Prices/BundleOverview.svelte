<script lang="ts">
    import {onMount} from "svelte";
    import type {TBundle, TPrice} from "@Background/Modules/AugmentedSteam/_types";
    import {L} from "@Core/Localization/Localization";
    import {
        __bundle_header, __bundle_includes, __bundle_info,
        __bundle_offerEnds, __bundle_tier,
        __bundle_tierIncludes, __buy,
        __buyPackage
    } from "@Strings/_strings";
    import Price from "@Content/Modules/Currency/Price";
    import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
    import external from "@Content/externalLink";

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

{#if data.length > 0 && data.some(v => !v.expiry || Date.parse(v.expiry) > Date.now())}
    <h2 class="gradientbg es_external_icon">{L(__bundle_header)}</h2>

    {#each data as bundle}
        {@const expiry = bundle.expiry ? new Date(bundle.expiry) : null}
        {#if expiry === null || expiry.valueOf() > Date.now()}
            {@const bundlePrice = getBundlePrice(bundle)}

            <div class="game_area_purchase_game">
                <div class="game_area_purchase_platform"></div>
                <h1>{L(__buyPackage, {"package": `${bundle.page.name} ${bundle.title}`})}</h1>

                {#if expiry}
                    <p class="game_purchase_discount_countdown">
                        {L(__bundle_offerEnds)}
                        {expiry.toLocaleDateString()}
                    </p>
                {/if}

                <p class="package_contents">
                    {#each bundle.tiers as tier, num}
                        <b class="as_bundle_tier_title"> <!-- class added for compatibility with Steam Currency Converter -->
                            {#if bundle.tiers.length > 1}
                                {L(__bundle_tierIncludes, {
                                    "tier": L(__bundle_tier, {"num": num+1}),
                                    "price": tier.price ? getPrice(tier.price).toString() : "",
                                    "num": tier.games.length
                                })}:
                            {:else}
                                {L(__bundle_includes, {"num": tier.games.length})}:
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
                            <a class="btn_blue_steamui btn_medium" href={bundle.details} use:external>
                                <span>{L(__bundle_info)}</span>
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
                            <a class="btn_green_steamui btn_medium" href={bundle.url} use:external>
                                <span>{L(__buy)}</span>
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
