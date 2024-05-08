<svelte:options immutable />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__hide, __update_dontShow} from "@Strings/_strings";
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{
        close: void,
        hide: void
    }>();
</script>


<div class="es_warn">
    <div class="es_warn__cnt">
        <div><slot></slot></div>
        <div class="es_warn__control">
            <button type="button" class="es_warn__btn" on:click={() => dispatch("close")}>{L(__update_dontShow)}</button>
            <button type="button" class="es_warn__btn" on:click={() => dispatch("hide")}>{L(__hide)}</button>
        </div>
    </div>
</div>


<style>
    .es_warn {
        font-size: 12px;
        padding: 8px 0;
        text-align: center;
        background: linear-gradient(#9a2820 0%, #d63525 100%);
        color: white;
    }

    .es_warn__cnt {
        max-width: 940px;
        display: flex;
        justify-content: space-between;
        margin: auto;
        line-height: 20px;
    }
    .es_warn__cnt button {
        text-decoration: underline;
    }

    .es_warn__control {
        white-space: nowrap;
    }

    button {
        background: linear-gradient(135deg, #faa 0%,#d46a6a 100%);
        padding: 0 10px;
        color: black;
        text-transform: uppercase;
        font-size: 11px;
        border-radius: 1px;
        text-decoration: none !important;
        display: inline-block;
        line-height: 20px;
        cursor: pointer;
        white-space: nowrap;
    }
    button:hover {
        background: linear-gradient(135deg, #801515 0%,#500 100%);
        color: white;
    }
</style>
