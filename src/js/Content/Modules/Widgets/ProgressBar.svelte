<script lang="ts">
    import {onMount} from "svelte";
    import {__ready_failed, __ready_loading, __ready_ready, __ready_serverOutage} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let react: boolean;

    let started: number = 0;
    let done: number = 0;
    let failed: number = 0;

    let progress: number = 0;
    let isLoading: boolean = false;

    let hasWarning: boolean = false;
    let hasError: boolean = false;

    $: if (started > 0) {
        progress = Math.min(100, 100 * (done / started));

        isLoading = (done + failed) < started;
    }

    onMount(() => {
        function onStart(): void {
            started += 1;
        }

        function onDone(): void {
            done += 1;
        }

        function onError(e: Event) {
            failed += 1;

            const name = (<CustomEvent>e).detail.name ?? null;

            if (name === "ServerOutageError") {
                hasWarning = true;
            } else {
                hasError = true;
            }
        }

        document.addEventListener("asRequestStart", onStart);
        document.addEventListener("asRequestDone", onDone);
        document.addEventListener("asRequestError", onError);

        return () => {
            document.removeEventListener("asRequestStart", onStart);
            document.removeEventListener("asRequestDone", onDone);
            document.removeEventListener("asRequestError", onError);
        }
    });
</script>


<div class="wrapper" class:is-react={react} class:is-legacy={!react}>
    <div class="progress"
         class:is-complete="{!isLoading}"
         class:is-warning="{hasWarning}"
         class:is-error="{hasError}"
         title={L(isLoading ? __ready_loading : __ready_ready)}>
        <div class="bar">
            <div class="value" style:width="{isLoading ? progress : 18}px"></div>
        </div>
    </div>

    {#if hasError}
        <div class="error">{L(__ready_failed, {"amount": failed})}</div>
    {:else if hasWarning}
        <div class="warning">{L(__ready_serverOutage)}</div>
    {/if}
</div>


<style>
    .wrapper.is-legacy {
        position: relative;
        float: right;
    }
    .wrapper.is-react {
        position: absolute;
        top: 0;
        right: 0;
    }

    .progress {
        position: relative;
        top: 55px;
        width: 100px;
        min-width: 16px;
        height: 16px;
        box-sizing: content-box;
        border-radius: 8px;
        overflow: hidden;
        border-bottom: 1px solid rgba(255, 255, 255, 0.20);
    }
    .is-error,
    .is-warning,
    .is-complete {
        width: 16px;
    }
    .progress,
    .value {
        transition: width 1s ease-in-out;
    }
    .value {
        width: 18px;
    }
    /* This prevents the black bleeding from "es_progress__bar" background
        around the edges of "es_progress__value" to make it look smoother */
    .is-error .value,
    .is-warning .value,
    .is-complete .value {
        width: calc(100% + 4px) !important;
    }
    .is-complete {
        animation: delayBoxShadowGreen linear 1s;
        animation-fill-mode: forwards;
    }
    .is-error, .is-warning {
        cursor: help;
        animation: linear 1s;
        animation-fill-mode: forwards;
    }
    .is-error {
        animation-name: delayBoxShadowRed;
    }
    .is-warning {
        animation-name: delayBoxShadowYellow;
    }
    .is-error::before, .is-warning::before {
        display: block;
        content: "!";
        position: absolute;
        top: 2px;
        right: 0;
        left: 0;
        line-height: 12px;
        text-align: center;
        font-size: 14px;
        font-family: Impact, Charcoal, sans-serif;
        text-shadow: 0 0 1px black;
    }
    .is-error::before {
        color: rgb(255, 149, 149);
    }
    .is-warning::before {
        color: white;
    }
    .progress .bar {
        background-color: black;
        border-radius: 8px;
    }
    .value {
        height: 16px;
        margin-left: -2px;
        background-color: #51771d;
        border-radius: 8px;
        background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 5%, rgba(255, 255, 255, 0) 95%);
    }
    .is-error .value, .is-warning .value {
        transition: unset;
        border-radius: 8px;
    }
    .is-error .value {
        background-color: #b31414;
    }
    .is-warning .value {
        background-color: #d9ab05;
    }
    @keyframes delayBoxShadowRed {
        100% {
            box-shadow: 0 0 8px 1px #b31414;
        }
    }
    @keyframes delayBoxShadowYellow {
        100% {
            box-shadow: 0 0 8px 1px #d9ab05;
        }
    }
    @keyframes delayBoxShadowGreen {
        100% {
            box-shadow: 0 0 8px 1px #51771d;
        }
    }

    .error, .warning {
        display: none;
        color: #ccc;
        font-size: 11px;
        background-color: #333;
        border: 1px solid #444;
        position: absolute;
        min-width: 200px;
        max-width: 250px;
        padding: 5px;
        top: 52px;
        right: 22px;
        list-style-position: inside;
    }
    .error::before, .warning::before {
        content: "";
        display: block;
        background-color: #444;
        width: 10px;
        height: 10px;
        position: absolute;
        top: 5px;
        right: -5px;
        z-index: -1;
        transform: rotateZ(45deg);
    }
    .wrapper:hover .error, .wrapper:hover .warning {
        display: block !important;
    }
</style>
