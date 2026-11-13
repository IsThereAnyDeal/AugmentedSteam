<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import external from "@Content/externalLink";

    interface Props {
        appid: number
    }

    let { appid }: Props = $props();
</script>


{#if Settings.showitadlinks}
    <a href="https://isthereanydeal.com/steam/app/{appid}/"
       class="itad_ico"
       {@attach external}>
        <span>
            <i class="ico16"></i>
            ITAD
        </span>
    </a><!--
-->{/if}<!--

-->{#if Settings.showsteamdb}<!--
    --><a href="https://steamdb.info/app/{appid}/"
          class="steamdb_ico"
          {@attach external}>
        <i class="ico16"></i>
        SteamDB
    </a>
{/if}


<style>
    a {
        border-radius: 2px;
        padding: 1px 15px;
        display: inline-block;
        font-size: 15px;
        line-height: 30px;
        color: #67c1f5;
        background: #67c1f533;
        margin-left: 5px;

        &:hover {
            color: #fff;
            background: linear-gradient( -60deg, #417a9b 5%, #67c1f5 95%);
        }
    }

    i {
        margin: 7px 0;
        vertical-align: top;
    }

    .itad_ico {
        i         { background-image: url("extension://img/itad_small.png"); }
        &:hover i { background-image: url("extension://img/itad_small_black.png"); }
    }

    .steamdb_ico {
        i         { background-image: url("extension://img/steamdb_store.png"); }
        &:hover i { background-image: url("extension://img/steamdb_store_black.png"); }
    }
</style>