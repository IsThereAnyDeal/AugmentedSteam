<script lang="ts">
    interface Props {
        id: string;
        gray?: boolean;
        iconUrl?: string|undefined;
    }

    let { id, gray = false, iconUrl = undefined }: Props = $props();
</script>


{#if id === "custom" && iconUrl}
    <i class:as-gray={gray} style="background-image:url({iconUrl})"></i>
{:else}
    <i class="asi-{id}" class:as-gray={gray}></i>
{/if}


<style>
    i {
        display: inline-block;
        width: 20px;
        height: 20px;
        margin: 0 5px 0 0;
        background-repeat: no-repeat;
        background-size: 16px !important;
        background-position: center;
        border-radius: 2px;
    }
    .as-gray {
        filter: grayscale(100%);
    }

    .asi-steamrepcn {
        background-image: url("extension://img/ico/srcn.png");
    }
    .asi-steamdbcalc {
        background-image: url("extension://img/ico/steamdb.png");
    }
    .asi-steamgifts {
        background-image: url("extension://img/ico/steamgifts.png");
    }
    .asi-steamtrades {
        background-image: url("extension://img/ico/steamtrades.png");
    }
    .asi-bartervg {
        background-image: url("extension://img/ico/bartervg.png");
    }
    .asi-backpacktf {
        background-image: url("extension://img/ico/backpacktf.png");
    }
</style>
