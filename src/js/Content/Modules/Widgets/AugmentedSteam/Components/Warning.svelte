<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__hide, __update_dontShow} from "@Strings/_strings";
    import {createEventDispatcher} from "svelte";

    export let react: boolean;

    const dispatch = createEventDispatcher<{
        close: void,
        hide: void
    }>();
</script>


<div class="es_warn" class:is-react={react}>
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
        background: #9a2820;
        border-top: 1px solid #d63525;
        border-bottom: 1px solid #d63525;
        margin-bottom: -1px;
        color: white;
    }
    .es_warn.is-react {
        margin-left: -14px;
        padding-left: 14px;
    }

    .es_warn__cnt {
        max-width: 940px;
        display: flex;
        justify-content: space-between;
        align-items: center;
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
        background: #ffaaaa;
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
        border: 0;
    }
    button:hover {
        background: #e89a9a;
    }
</style>
