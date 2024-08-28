<script lang="ts">
    export let id: string;
    export let iconType: string;
    export let iconUrl: string|undefined = undefined;
</script>


{#if id === "custom" && iconUrl}
    <i class="es_sites_icons es_{iconType}" style="background-image: url({iconUrl});"></i>
{:else}
    <i class="es_sites_icons es_{id}_icon es_{iconType}"></i>
{/if}


<style>
    .es_sites_icons {
        display: inline-block;
        width: 16px;
        height: 16px;
        margin: 0 5px 0 0;
        background-color: #222222;
        background-repeat: no-repeat;
        background-size: 16px !important;
        background-position: 2px 2px !important;
        padding: 2px;
        border-radius: 3px;
        box-shadow: inset 0 0 1px 1px rgb(0, 0, 0), 0 0 0 1px rgba(193, 193, 193, 0.17);
        vertical-align: top;
    }
    .es_sites_icons.es_gray {
        filter: grayscale(100%);
    }

    .es_sites_icons.es_steamrepcn_icon {
        background-image: url("extension://img/ico/srcn.png");
    }
    .es_sites_icons.es_steamrep_icon {
        background-image: url("extension://img/ico/steamrep.png");
        background-color: rgb(235, 235, 235);
    }
    .es_sites_icons.es_steamdbcalc_icon {
        background-image: url("extension://img/ico/steamdb.png");
    }
    .es_sites_icons.es_steamgifts_icon {
        background-image: url("extension://img/ico/steamgifts.png");
    }
    .es_sites_icons.es_steamtrades_icon {
        background-image: url("extension://img/ico/steamtrades.png");
    }
    .es_sites_icons.es_bartervg_icon {
        background-image: url("extension://img/ico/bartervg.png");
    }
    .es_sites_icons.es_astats_icon {
        background-image: url("extension://img/ico/achievementstats.png");
    }
    .es_sites_icons.es_backpacktf_icon {
        background-image: url("extension://img/ico/backpacktf.png");
    }
    .es_sites_icons.es_astatsnl_icon {
        background-image: url("extension://img/ico/astatsnl.png");
    }
</style>
