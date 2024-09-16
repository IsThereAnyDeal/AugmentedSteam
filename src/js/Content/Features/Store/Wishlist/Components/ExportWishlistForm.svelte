<svelte:options accessors />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__export_format, __export_text, __export_type} from "@Strings/_strings";
    import {slide} from "svelte/transition";
    import {createEventDispatcher, onMount} from "svelte";

    const dispatch = createEventDispatcher<{setup: void}>();

    export let type: "text"|"json";
    export let format: string;

    let input: HTMLInputElement;

    function add(value: string): void {
        if (!input) { return; }
        format = input.value;

        if (input.selectionStart !== null) {
            const selection = input.selectionStart;
            if (input.selectionEnd && selection !== input.selectionEnd) {
                format = format.slice(0, selection) + format.slice(input.selectionEnd);
            }
            format = format.slice(0, selection) + value + format.slice(selection);
            input.selectionStart = selection + value.length;
        } else {
            format = format + value;
            input.selectionStart = format.length;
        }
        input.selectionEnd = input.selectionStart;
        input.focus();
    }

    $: type, format, dispatch("setup");

    onMount(() => {
        window.dispatchEvent(new Event("resize"));
    });
</script>


<div class="as_wexport_container">
    <div class="as_wexport">
        <h2>{L(__export_type)}</h2>
        <div class="as_wexport_buttons">
            <label><input type="radio" value="text" bind:group={type} on:change> {L(__export_text)}</label>
            <label><input type="radio" value="json" bind:group={type} on:change> JSON</label>
        </div>
    </div>

    {#if type === "text"}
        <div class="as_wexport" transition:slide={{axis: "y", duration: 200}}>
            <h2>{L(__export_format)}</h2>
            <div>
                <input type="text" bind:value={format} bind:this={input} on:change>
                <div class="as_wexport_symbols">
                    {#each ["%title%", "%id%", "%appid%", "%url%", "%release_date%", "%price%", "%discount%", "%base_price%", "%type%", "%note%"] as str, index}
                        {#if index > 0}, {/if}
                        <button type="button" on:click={() => add(str)}>{str}</button>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>


<style>
    .as_wexport_container {
        width: 580px;
    }
    .as_wexport {
        margin-bottom: 30px;
    }
    .as_wexport_buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px
    }
    .as_wexport_symbols {
        margin-top: 2px;
        font-size: 11px;
    }

    label {
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        border-radius: 8px;
        border: 1px solid #333643;
        text-align: left;
        cursor: pointer;
    }
    label:hover {
        color: white;
        border-color: white;
    }
    label:has(input[type=radio]:checked) {
        color: white;
        border-color: #1a97ff;
    }
    label input[type=radio] {
        display: none;
    }

    input[type=text] {
        width: 100%;
        color: #b9bfc6;
        background-color: #313c48;
        box-shadow: 1px 1px 0 rgba(0,0,0,0.2) inset;
        border-radius: 3px;
        font-size: 12px;
        padding: 10px;
        border: none;
        box-sizing: border-box;
    }

    button {
        background: inherit;
        border: 0;
        outline: 0;
        padding: 0;
        color: #acb2b8;
        cursor: pointer;
    }
    button:hover {
        text-decoration: underline;
        color: white;
    }
</style>
