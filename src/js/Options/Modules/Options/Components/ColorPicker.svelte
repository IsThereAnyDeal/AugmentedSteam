<svelte:options immutable={false} />

<script lang="ts" context="module">
    import "@melloware/coloris/dist/coloris.css";
    import Coloris from "@melloware/coloris";

    let counter: number = 0;

    Coloris.init();
</script>

<script lang="ts">
    import {onMount, tick} from "svelte";
    import {__close, __theworddefault} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    const id = "coloris-"+(counter++);

    export let value: string;
    export let defaultColor: string;

    let node: HTMLInputElement;

    onMount(() => {
        Coloris.coloris({
            el: node
        });

        Coloris.setInstance(`#${id}`, {
            theme: "large",
            themeMode: "dark",
            alpha: false,
            closeButton: true,
            closeLabel: L(__close),
            clearButton: true,
            clearLabel: L(__theworddefault),
            swatches: [
                "#00ce67",
                "#0491bf",
                "#a26426",
                "#800040",
                "#513c73",
                "#4f4f4f",
                "#856d0e",
                "#4c7521"
            ],
            onChange: async (color: string) => {
                if (color === "") {
                    value = defaultColor;

                    await tick();
                    node.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
    });
</script>


<div>
    <input type="text" {id} bind:this={node} bind:value>
</div>


<style>
    div {
        display: inline-flex;
    }

    input {
        width: 30px;
        padding: 0;
        border: 0;
        height: 30px;
        cursor: pointer;
    }

    div :global(button) {
        width: 100%;
    }

    div :global(.clr-field) {
        border-radius: 15px;
        overflow: hidden;
        border: 1px solid transparent;
    }
    div :global(.clr-field:hover) {
        border-color: white;
    }
</style>
