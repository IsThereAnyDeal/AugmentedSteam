<svelte:options accessors />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__export_format, __export_text, __export_type} from "@Strings/_strings";

    export let type: "text"|"json";
    export let format: string;
</script>


<div class="es-wexport">
    <h2>{L(__export_type)}</h2>
    <div>
        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="text" bind:group={type} on:change> {L(__export_text)}</label>
        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="json" bind:group={type} on:change> JSON</label>
    </div>
</div>
<div class="es-wexport es-wexport__format" class:es-grayout={type === "json"}>
    <h2>{L(__export_format)}</h2>
    <div>
        <input type="text" id="es-wexport-format" class="es-wexport__input" bind:value={format} on:change><br>
        <div class="es-wexport__symbols">%title%, %id%, %appid%, %url%, %release_date%, %price%, %discount%, %base_price%, %type%, %note%</div>
    </div>
</div>


