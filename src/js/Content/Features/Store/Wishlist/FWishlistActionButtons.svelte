<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__emptyWishlist_title, __export_wishlist} from "@Strings/_strings";
    import Settings from "@Options/Data/Settings";
    import type {WishlistEntry} from "./CWishlist";
    import EmptyWishlist from "./EmptyWishlist";
    import ExportWishlist from "./ExportWishlist";

    export let myWishlist: boolean;
    export let wishlistData: WishlistEntry[];

    function onEmptyWishlist(): void {
        EmptyWishlist.showDialog(wishlistData);
    }

    function onExportWishlist(): void {
        ExportWishlist.showDialog();
    }
</script>


{#if myWishlist && Settings.showemptywishlist}
    <button class="as_wbtn as_empty_wishlist" on:click={onEmptyWishlist}>{L(__emptyWishlist_title)}</button>
{/if}
<button class="as_wbtn as_export_wishlist" on:click={onExportWishlist}>{L(__export_wishlist)}</button>


<style>
    :global(#cart_status_data) {
        display: flex;
        align-items: center;
    }

    .as_wbtn {
        color: #fff;
        float: right;
        cursor: pointer;
        font-size: 11px;
        text-transform: uppercase;
        padding: 0 25px;
        line-height: 20px;
    }
    .as_empty_wishlist {
        margin-right: 3px;
        background-color: #bf5a5a;
    }
    .as_empty_wishlist:hover {
        background-color: #ffd1d1;
        color: black;
    }
    .as_export_wishlist {
        background-color: #6c94a0;
        margin-right: 15px;
    }
    .as_export_wishlist:hover {
        background-color: #dbdee1;
        color: black;
    }
</style>
