<script lang="ts">
    import {__getHelp} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        appid: number
    }

    let { appid }: Props = $props();
</script>


<div class="game_area_already_owned_btn">
    <a class="btnv6_lightblue_blue btnv6_border_2px btn_medium" href="https://help.steampowered.com/wizard/HelpWithGame/?appid={appid}">
        <span>{L(__getHelp)}</span>
    </a>
</div>