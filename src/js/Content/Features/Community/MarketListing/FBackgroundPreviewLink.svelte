<script lang="ts">
    import {__previewBackground} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let profileUrl: string;
    export let background: string;
</script>


<a target="_blank" href="{profileUrl}#previewBackground/{background}">{L(__previewBackground)}</a>


<style>
    a {
        position: absolute;
        bottom: -25px;
        right: 5px;
        font-size: 12px;
        line-height: 20px;
        text-decoration: none;
        color: #afafaf;

        &:hover {
            text-decoration: underline;
        }
    }
</style>