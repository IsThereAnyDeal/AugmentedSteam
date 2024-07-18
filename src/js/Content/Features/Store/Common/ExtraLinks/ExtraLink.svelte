<script lang="ts">
    export let href: string;
    export let icon: string = "";
    export let iconUrl: string|null = null;
</script>


<a class="btnv6_blue_hoverfade btn_medium es_app_btn {icon}" target="_blank" {href}>
    <span>
        {#if iconUrl}
            <i class="ico16" style="background: url({iconUrl}); background-size: contain;"></i>
        {:else}
            <i class="ico16"></i>
        {/if}
        <slot></slot>
    </span>
</a>


<style>
    .es_app_btn {
        display: block !important;
        margin-bottom: 6px;
    }
    .es_app_btn .ico16 {
        margin-right: 12px !important;
    }

    .steamdb_ico i {
        background-image: url("extension://img/steamdb_store.png");
    }
    .steamdb_ico:hover i {
        background-image: url("extension://img/steamdb_store_black.png");
    }
    .itad_ico i {
        background-image: url("extension://img/itad_small.png");
    }
    .itad_ico:hover i {
        background-image: url("extension://img/itad_small_black.png");
    }
    .bartervg_ico i {
        background-image: url("extension://img/bartervg.png");
    }
    .as_youtube_btn i {
        background-image: url("extension://img/icon-youtube.png");
    }
    .twitch_btn i {
        background-image: url("extension://img/icon-twitch.png");
    }
    .pcgw_btn i {
        background-image: url("extension://img/pcgw.png");
    }
    .completionistme_btn i {
        background-image: url("extension://img/icon-completionistme.png");
    }
    .protondb_btn i {
        background-image: url("extension://img/icon-protondb.png");
    }
    .cardexchange_btn i {
        background-image: url("extension://img/steamcardexchange.png");
    }
</style>
