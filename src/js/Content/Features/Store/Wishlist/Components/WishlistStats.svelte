<script lang="ts">
    import {
        __loading,
        __wl_hidden, __wl_hiddenTooltip,
        __wl_inWishlist, __wl_label,
        __wl_noPrice,
        __wl_onSale,
        __wl_totalPrice,
        __remove
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {
        CStoreBrowse_GetItems_Request,
        CStoreBrowse_GetItems_Response,
        type IStoreItemID, StoreBrowseContext, StoreBrowseItemDataRequest, StoreItemID
    } from "@Protobufs/Compiled/proto.bundle";
    import ServiceFactory from "@Protobufs/ServiceFactory";
    import ProtobufUtils from "@Protobufs/ProtobufUtils";
    import type UserInterface from "@Core/User/UserInterface";
    import type Language from "@Core/Localization/Language";
    import type {WishlistEntry} from "@Content/Features/Store/Wishlist/CWishlist";
    import {onMount} from "svelte";
    import Price from "@Content/Modules/Currency/Price";
    import ExtensionResources from "@Core/ExtensionResources";

    const PageSize = 50;

    export let user: UserInterface;
    export let language: Language;
    export let wishlistData: WishlistEntry[];
    export let canEdit: boolean;

    const service = ServiceFactory.StoreBrowseService(user);

    const count: number = wishlistData.length;
    let totalPrice: number = 0;
    let onSaleCount: number = 0;
    let noPriceCount: number = 0;
    let unlistedApps: IStoreItemID[] = [];

    let promise: Promise<void>;

    let isOpen: boolean = false;
    let isHiddenOpen: boolean = false;

    const icons = {
        itad: ExtensionResources.getURL("img/itad.png"),
        steamdb: ExtensionResources.getURL("img/ico/steamdb.png"),
    };

    async function loadPage(ids: IStoreItemID[]): Promise<CStoreBrowse_GetItems_Response> {
        const request = new CStoreBrowse_GetItems_Request({
            context: new StoreBrowseContext({
                countryCode: user.storeCountry,
                language: language.name,
                steamRealm: 1
            }),
            dataRequest: new StoreBrowseItemDataRequest({
                includeBasicInfo: true
            }),
            ids
        });

        return await service.getItems(request);
    }

    async function loadStats(): Promise<void> {
        const ids = wishlistData.map(item => new StoreItemID({
            appid: item.appid
        })) ?? [];

        for (let offset= 0; offset < count; offset += PageSize) {
            const chunk = ids.slice(offset, offset+PageSize);
            if (chunk.length === 0) {
                break;
            }

            const page = await loadPage(chunk);

            for (const item of page.storeItems) {
                const option = item.bestPurchaseOption;
                if (!option) {
                    if (item.unlisted) {
                        unlistedApps.push(item);
                    } else {
                        noPriceCount++;
                    }
                    continue;
                }

                const finalPrice = ProtobufUtils.getNumber(option.finalPriceInCents) ?? 0;
                const discount = ProtobufUtils.getNumber(option.discountPct) ?? 0;

                totalPrice += finalPrice;

                if (discount > 0) {
                    onSaleCount++;
                }
            }
        }

        totalPrice = totalPrice;
        noPriceCount = noPriceCount;
        onSaleCount = onSaleCount;
        unlistedApps = unlistedApps;
    }

    async function handleRemove(app: IStoreItemID): Promise<void> {
        await ServiceFactory.WishlistService(user)
            .removeFromWishlist({appid: app.appid!});

        const index = unlistedApps.findIndex(id => id.appid === app.appid!);
        if (index >= 0) {
            unlistedApps.splice(index, 1);
            unlistedApps = unlistedApps;
        }
    }

    function openStats() {
        promise ??= loadStats();
        isOpen = true;
    }

    onMount(() => {
        document.addEventListener("as:openStats", openStats);

        return () => {
            document.removeEventListener("as:openStats", openStats);
        }
    });
</script>

{#if isOpen}
    <Modal title={L(__wl_label).toUpperCase()} showClose on:button={() => isOpen = false}>
        {#if !promise}
            {L(__loading)}
        {:else}
            {#await promise}
                {L(__loading)}
            {:then _}
                <div class="stats">
                    <div class="stat">
                        {new Price(totalPrice/100)}
                        <span class="label">{L(__wl_totalPrice)}</span>
                    </div>

                    <div class="stat">
                        {count}
                        <span class="label">{L(__wl_inWishlist)}</span>
                    </div>

                    <div class="stat">
                        {onSaleCount}
                        <span class="label">{L(__wl_onSale)}</span>
                    </div>

                    <div class="stat">
                        {noPriceCount}
                        <span class="label">{L(__wl_noPrice)}</span>
                    </div>

                    {#if unlistedApps.length > 0}
                        <!-- TODO better tooltips -->
                        <!-- TODO use button, cba to style button right now -->
                        <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
                        <div class="stat button" title={L(__wl_hiddenTooltip)} on:click={() => isHiddenOpen = true}>
                            {unlistedApps.length}
                            <span class="label">
                                {L(__wl_hidden)}
                                <span>(?)</span>
                            </span>
                        </div>
                    {/if}
                </div>
            {/await}
        {/if}
    </Modal>

    {#key unlistedApps}
        {#if isHiddenOpen && unlistedApps && unlistedApps.length > 0}
            <Modal title="Hidden apps" showClose on:button={() => isHiddenOpen = false}>
                {#each unlistedApps as app (app.appid)}
                    {@const appid = app.appid}
                    <div class="unlisted">
                        <a href="https://steamcommunity.com/app/{appid}/discussions/" target="_blank">
                            <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{appid}/header_292x136.jpg" class="banner" alt="Banner" loading="lazy" />
                        </a>
                        <a href="https://isthereanydeal.com/steam/app/{appid}/" target="_blank"><img src={icons.itad} alt="ITAD" /></a>
                        <a href="https://steamdb.info/app/${appid}/" target="_blank"><img src={icons.steamdb} alt="SteamDB" /></a>
                        {#if canEdit}
                            <!-- TODO use button, cba to style button right now -->
                            <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
                            <div on:click={() => handleRemove(app)} class="remove button">{L(__remove)}</div>
                        {/if}
                    </div>
                {/each}
            </Modal>
        {/if}
    {/key}
{/if}


<style>
    .stats {
        max-width: 100%;
        width: 940px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        gap: 30px;
        align-items: center;
        font-size: 1.6em;
        text-align: center;
    }
    .stat {
        font-size: 35px;
        font-weight: 300;
        color: white;
    }
    .label {
        display: block;
        color: #1a9fff;
        font-weight: bold;
        font-size: 19px;
    }
    .label span {
        color: #66c0f4;
    }


    .unlisted {
        display: flex;
        align-items: center;
        column-gap: 30px;
        margin-bottom: 5px;
        background-color: rgba(0, 0, 0, 0.2);
        cursor: pointer;
    }
    .banner {
        width: 162px;
        height: 75px;
    }

    .remove {
        margin-right: 5px;
        margin-left: auto;
        text-decoration: underline;
    }
    .remove:hover {
        color: #d8dde2;
    }
    .button {
        cursor: pointer;
    }
</style>