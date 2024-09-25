<svelte:options accessors />

<script lang="ts">
    import {onMount} from "svelte";

    export let note: string;

    let input: HTMLTextAreaElement;

    onMount(() => {
        input.focus();
        input.setSelectionRange(0, input.textLength);

        /**
         * Native keyup handler ignores events on <textarea>s
         * https://github.com/SteamDatabase/SteamTracking/blob/6aabc1d81478c9a3f33598cd0968b5fdaf14f8b8/steamcommunity.com/public/shared/javascript/shared_global.js#L477
         */
        input.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                input.dispatchEvent(new Event("change")); // Workaround for FF
                document.querySelector<HTMLElement>(".newmodal_buttons > .btn_medium")?.click();
            }
        });
    });
</script>


<div class="newmodal_prompt_with_textarea gray_bevel fullwidth">
    <textarea rows="6" cols="12" bind:this={input} bind:value={note} on:change></textarea>
</div>
