<script lang="ts">
    import {__communityHub} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        appid: number;
    }

    let { appid }: Props = $props();
</script>


<div>
    <a class="btnv6_blue_hoverfade btn_medium" href="https://steamcommunity.com/app/{appid}/">
        <span>{L(__communityHub)}</span>
    </a>
</div>


<style>
    div {
        position: relative;
        float: right;
    }
</style>