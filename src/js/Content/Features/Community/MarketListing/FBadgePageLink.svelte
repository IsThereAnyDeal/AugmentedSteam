<script lang="ts">
    import {__viewBadge} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        gameAppId: number,
        isFoil: boolean
    }

    let { gameAppId, isFoil }: Props = $props();
</script>


<div>
    <a href="https://steamcommunity.com/my/gamecards/{gameAppId}{isFoil ? "?border=1" : ""}" target="_blank">
        <img src="https://store.steampowered.com/public/images/v6/ico/ico_cards.png" alt="Card icon">
        {L(__viewBadge)}
    </a>
</div>


<style>
    div {
        display: flex;
        flex-grow: 1;
        justify-content: flex-end;
    }

    a {
        display: inline-flex;
        align-items: center;
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

    img {
        height: 16px;
    }
</style>