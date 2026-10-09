<script lang="ts">
    import { createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import {onMount} from "svelte";

    interface Props {
        note: string;
    }

    let { note = $bindable() }: Props = $props();

    let input: HTMLTextAreaElement = $state();

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

    export {
    	note,
    }
</script>


<div class="newmodal_prompt_with_textarea gray_bevel fullwidth">
    <textarea rows="6" cols="12" bind:this={input} bind:value={note} onchange={bubble('change')}></textarea>
</div>
