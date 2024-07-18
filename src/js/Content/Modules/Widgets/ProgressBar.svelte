<script lang="ts">
    import {onMount} from "svelte";
    import {__ready_failed, __ready_loading, __ready_ready, __ready_serverOutage} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    let started: number = 0;
    let done: number = 0;
    let failed: number = 0;

    let progress: number = 0;
    let isLoading: boolean = false;

    let hasWarning: boolean = false;
    let hasError: boolean = false;

    function update() {
        progress = started > 0
            ? Math.min(100, 100 * (done / started))
            : 0;

        isLoading = started > 0 && (done + failed) < started;
    }

    function reset(): void {
        started = 0;
        done = 0;
        failed = 0;
        hasWarning = false;
        hasError = false;
        update();
    }

    onMount(() => {
        function onStart(): void {
            started = started+1;
            update();
        }

        function onDone(): void {
            done = done + 1;
            update();
        }

        function onError(e: Event) {
            failed = failed + 1;
            update();

            // @ts-ignore
            const name = e.detail.name ?? null;

            if (name === "ServerOutageError") {
                hasWarning = true;
            } else {
                hasError = true;
            }
        }

        document.addEventListener("asRequestStart", onStart);
        document.addEventListener("asRequestDone", onDone);
        // @ts-ignore
        document.addEventListener("asRequestError", onError);

        return () => {
            document.removeEventListener("asRequestStart", onStart);
            document.removeEventListener("asRequestDone", onDone);
            // @ts-ignore
            document.removeEventListener("asRequestError", onError);
        }
    });
</script>


<div class="wrapper">
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
    .progress {
        float: right;
        position: relative;
        margin-top: 55px;
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
    .wrapper {
        position: relative;
        float: right;
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
