<script lang="ts">
    import {
        __loading,
        __remove,
        __wl_hidden,
        __wl_hiddenTooltip,
        __wl_inWishlist,
        __wl_label,
        __wl_noPrice,
        __wl_onSale,
        __wl_totalPrice
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import ServiceFactory from "@Protobufs/ServiceFactory";
    import Price from "@Content/Modules/Currency/Price";
    import ExtensionResources from "@Core/ExtensionResources";
    import WishlistStats from "@Content/Features/Store/Wishlist/Components/WishlistStats.svelte";
    import {StoreItem} from "@Protobufs/Compiled/proto.bundle";
    import type UserInterface from "@Core/User/UserInterface";

    const itadIcon = ExtensionResources.getURL("img/itad.png");
    const steamdbIcon = ExtensionResources.getURL("img/ico/steamdb.png");

    interface Props {
        user: UserInterface,
        stats: WishlistStats
        canEdit: boolean,
        onclose: () => void
    }

    let {
        user,
        stats,
        canEdit,
        onclose
    }: Props = $props();

    let isHiddenOpen: boolean = $state(false);

    async function onremove(app: StoreItem.$Properties): Promise<void> {
        if (!canEdit) {
            return;
        }

        await ServiceFactory.WishlistService(user)
            .removeFromWishlist({appid: app.id!});

        const index = stats.hiddenApps.findIndex(item => item.id === app.id!);
        if (index >= 0) {
            stats.hiddenApps.splice(index, 1);
        }
    }
</script>


<Modal title={L(__wl_label).toUpperCase()} showClose oncancel={onclose}>
    {#await stats.load()}
        {L(__loading)}
    {:then _}
        <ul>
            <li>
                {new Price(stats.totalPrice/100)}
                <span class="label">{L(__wl_totalPrice)}</span>
            </li>

            <li>
                {stats.count}
                <span class="label">{L(__wl_inWishlist)}</span>
            </li>

            <li>
                {stats.onSaleCount}
                <span class="label">{L(__wl_onSale)}</span>
            </li>

            <li>
                {stats.noPriceCount}
                <span class="label">{L(__wl_noPrice)}</span>
            </li>

            {#if stats.hiddenApps.length > 0}
                <li>
                    <!-- TODO better tooltips -->
                    <button type="button" title={L(__wl_hiddenTooltip)} onclick={() => isHiddenOpen = true}>
                        {stats.hiddenApps.length}
                        <span class="label">
                            {L(__wl_hidden)}
                            <span>(?)</span>
                        </span>
                    </button>
                </li>
            {/if}
        </ul>
    {/await}
</Modal>

{#key stats.hiddenApps}
    {#if isHiddenOpen && stats.hiddenApps && stats.hiddenApps.length > 0}
        <Modal title="Hidden apps" showClose oncancel={() => isHiddenOpen = false}>
            {#each stats.hiddenApps as app (app.id)}
                {@const appid = app.id}
                <div class="unlisted">
                    <a href="https://steamcommunity.com/app/{appid}/discussions/" target="_blank">
                        <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{appid}/header_292x136.jpg" class="banner" alt="Banner" loading="lazy" />
                    </a>
                    <a href="https://isthereanydeal.com/steam/app/{appid}/" target="_blank"><img src={itadIcon} alt="ITAD" /></a>
                    <a href="https://steamdb.info/app/{appid}/" target="_blank"><img src={steamdbIcon} alt="SteamDB" /></a>
                    {#if canEdit}
                        <button type="button" onclick={() => onremove(app)} class="remove">{L(__remove)}</button>
                    {/if}
                </div>
            {/each}
        </Modal>
    {/if}
{/key}


<style>
    ul {
        max-width: 100%;
        width: 940px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        gap: 30px;
        align-items: center;
        font-size: 1.6em;
        text-align: center;
        list-style-type: none;
    }
    li, li button {
        font-size: 35px;
        font-weight: 300;
        color: white;
    }
    button {
        background: transparent;
        border: 0;
        cursor: pointer;
    }

    .label {
        display: block;
        color: #1a9fff;
        font-weight: bold;
        font-size: 19px;

        & span {
            color: #66c0f4;
        }

        button:hover & {
            text-decoration: underline;
        }
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
        background: transparent;
        border: 0;
        cursor: pointer;
        margin-right: 5px;
        margin-left: auto;
        text-decoration: underline;
        color: #9dacbc;

        &:hover {
            color: white;
        }
    }
</style>
