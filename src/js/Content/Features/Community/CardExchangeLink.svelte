<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";

    interface Props {
        appid: number
    }

    let { appid }: Props = $props();
</script>


<div>
    <a href="https://www.steamcardexchange.net/index.php?gamepage-appid-{appid}/" target="_blank" title="Steam Card Exchange">
        <img src={ExtensionResources.getURL("img/ico/steamcardexchange.png")} alt="Steam Card Exchange">
    </a>
</div>


<style>
    div {
        float: inline-end;
        margin-left: 5px;
        position: relative;
        top: 3px;
        z-index: 4;
    }

    a {
        display: inline-block;
        overflow: hidden;
        border-radius: 2px;
        height: 24px;

        &:hover {
            filter: brightness(150%);
        }
    }

    img {
        width: 24px;
        height: 24px;
        border: 0;
    }
</style>
