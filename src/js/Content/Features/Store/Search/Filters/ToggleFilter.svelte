<script lang="ts">
    import type {Snippet} from "svelte";
    import FilterState from "@Content/Features/Store/Search/Filters/FilterState.svelte";

    interface Props {
        key: string,
        status: FilterState,
        children: Snippet<[void]>
    }

    let { key, status, children }: Props = $props();

    const checked = $derived(status.getBoolean(key));

    function onclick() {
        status.setBoolean(key, !checked);
    }
</script>


<button type="button" class={{checked}} {onclick}>
    <span class="checkbox"></span>
    <span class="label">{@render children()}</span>
</button>


<style>
    button {
        border: 0;
        outline: 0;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
        background: transparent;
        text-align: left;
        display: flex;
        align-items: center;
        cursor: pointer;
        height: 28px;
        padding: 0 8px;
        font-size: 13px;
        color: #9fbbcb;
        gap: 12px;

        &:hover {
            background: rgba( 255, 255, 255, 0.1);
            color: #ffffff;
        }

        &.checked {
            background: linear-gradient(135deg, #67c1f5 0%,#417a9b 100%);
            color: #ffffff;
        }
    }

    .checkbox {
        display: inline-block;
        vertical-align: text-bottom;
        width: 16px;
        height: 16px;
        background-image: url("https://store.fastly.steamstatic.com/public/images/v6/store_checkbox_blue.png");
        background-position: top center;

        .checked & {
            background-position: bottom center;
        }
    }

    .label {
        line-height: 18px;
        flex-grow: 1;
    }
</style>