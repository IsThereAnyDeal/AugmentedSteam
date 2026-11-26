<script lang="ts">
    import {__previewBackground} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        profileUrl: string;
        background: string;
    }

    let { profileUrl, background }: Props = $props();
</script>


<div>
    <a target="_blank" href="{profileUrl}#previewBackground/{background}">{L(__previewBackground)}</a>
</div>


<style>
    div {
        display: flex;
        flex-grow: 1;
        justify-content: flex-end;
    }

    a {
        display: inline-block;
        line-height: 24px;
        text-decoration: none;
        border-radius: var(--control-radius);
        font-size: var(--text-size-2);
        letter-spacing: var(--letter-spacing-2);
        padding: 0 var(--spacing-3);
        color: var(--color-accent-contrast);
        background: var(--color-dull-8);
        transition: background 200ms ease;

        &:hover {
            color: #fff;
            background: var(--color-dull-10);
        }
    }
</style>