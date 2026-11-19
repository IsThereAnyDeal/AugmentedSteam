<script lang="ts">
    import type {Snippet} from "svelte";

    interface Props {
        activeText: string,
        children: Snippet<[void]>
    }

    let { activeText, children }: Props = $props();
</script>


<div class="as-dropdown">
    <div class="as-active">
        <span>{activeText}</span>
        <i></i>
    </div>

    <ul>
        {@render children()}
    </ul>
</div>

<style>
    .as-dropdown {
        position: relative;

        &:hover ul {
            opacity: 1;
            pointer-events: auto;
        }
    }

    .as-active {
        cursor: pointer;
        background: #67c1f566;
        font-size: 12px;
        color: #67c1f5;
        line-height: 29px;
        padding: 0 7px;
        display: block;

        &:hover {
            color: #ffffff;
            background: linear-gradient(-60deg, #67c1f5, #417a9b);
        }

        & i {
            width: 19px;
            height: 12px;
            padding: 0;
            display: inline-block;
            background-image: url(https://store.cloudflare.steamstatic.com/public/images/v6/btn_arrow_down_padded.png);
            background-position: center;
            background-repeat: no-repeat;
            cursor: pointer;
            vertical-align: text-bottom;
        }

        &:hover i {
            background-image: url(https://store.cloudflare.steamstatic.com/public/images/v6/btn_arrow_down_padded_white.png);
        }
    }

    ul {
        opacity: 0;
        list-style-type: none;
        margin: 0;
        padding: 6px 0;
        background: #417a9b;
        box-shadow: 0 0 12px #000000;
        position: absolute;
        right: 0;
        z-index: 200;
        pointer-events: none;
        transition: opacity 200ms;
    }

    ul :global(li) {
        color: #e5e4dc;
        margin: 0 8px;

        &:hover {
            color: #171d25;
            background: #dcdedf;
        }

        & :global(a), & :global(button) {
            border: 0;
            outline: 0;
            text-decoration: none;
            font-size: 12px;
            line-height: normal;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 5px 12px;
            display: block;
            width: 100%;
            box-sizing: border-box;
            text-align: left;
            color: inherit;
            background: inherit;
            cursor: pointer;
        }
    }
</style>