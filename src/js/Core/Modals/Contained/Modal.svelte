<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import {fade} from "svelte/transition";
    import ModalButton from "@Core/Modals/Contained/ModalButton.svelte";
    import {EModalAction} from "@Core/Modals/Contained/EModalAction";

    const dispatch = createEventDispatcher<{
        button: EModalAction
    }>();

    export let title: string;
    export let body: string = "";
    export let showClose: boolean = false;
    export let buttons: {
        primary?: string,
        secondary?: string,
        cancel?: string
    }|undefined = undefined;
</script>

<div class="container">
    <div class="bg" in:fade={{duration: 200}}></div>
    <div class="modal">
        <div class="top-bar"></div>
        <div>
            <div class="header">
                {#if showClose}
                    <button type="button" on:click={() => dispatch("button", EModalAction.Cancel)}></button>
                {/if}
                <div class="title">{title}</div>
            </div>
        </div>
        <div class="content">
            <slot>{@html body}</slot>

            {#if buttons && (buttons?.primary || buttons?.secondary || buttons?.cancel)}
                <div class="buttons">
                    {#if buttons?.primary}
                        <ModalButton type="primary" on:click={() => dispatch("button", EModalAction.OK)}>{buttons.primary}</ModalButton>
                    {/if}
                    {#if buttons?.secondary}
                        <ModalButton type="secondary" on:click={() => dispatch("button", EModalAction.Secondary)}>{buttons.secondary}</ModalButton>
                    {/if}
                    {#if buttons?.cancel}
                        <ModalButton type="cancel" on:click={() => dispatch("button", EModalAction.Cancel)}>{buttons.cancel}</ModalButton>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>


<style>
    .container {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 900;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100vw;
        height: 100vh
    }

    .modal {
        position: relative;
        min-width: 500px;
        max-width: calc(100vw - 100px);
        margin: auto;
        font-family: "Motiva Sans", Sans-serif;
        font-weight: normal;
        background: radial-gradient(circle at top left, rgba(74, 81, 92, 0.4) 0%, rgba(75, 81, 92, 0) 60%), #25282e;
    }

    .top-bar {
        width: 100%;
        height: 1px;
        background: linear-gradient(to right, #00ccff, #3366ff);
    }

    .header {
        padding: 0;
        text-align: left;
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: unset;
        text-transform: unset;
    }

    button {
        border: none;
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVBREZBRDlBNzdCNzExRTI5ODAzRUE3MDU0Mzk5MjM5IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjVBREZBRDlCNzdCNzExRTI5ODAzRUE3MDU0Mzk5MjM5Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NUFERkFEOTg3N0I3MTFFMjk4MDNFQTcwNTQzOTkyMzkiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NUFERkFEOTk3N0I3MTFFMjk4MDNFQTcwNTQzOTkyMzkiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4iulRzAAABPElEQVR42mI8cuQIAyWABUqbAXEylH0fiDtwqI8FYhsoewEQH4cZcBaI64DYG8p/AVWADDyAeD4QMwPxJiA+BRJkgkr+BeJoIL4D5U8DYi0kzepAvAKq+TJU7V9kA0DgIxD7Q2lOIF4NpfmBeAuUfg3EPkD8BaaJCc2Z14A4EcoGuWAC1NkqQPwLqvkRsgYmLAG1HoiboOw0IA6EshNh/iZkAAjUA/FBJP5KIF6GTSEuAwygUQsDflAxogwQAuJ10AAExcpNKHsjEIsSMoAZGl2K0EALBeIIKFsOKSpxGtACxK5Qdi4QX4DiAqiYExB34TIgBIgrkAJtFpLcdKgYCBQBcRRMghGamUBxfhKIeaB+NkFOLFAAkjsDTZXfgdgK5DpYXvBGiqYpWDQzQMVAYZKDlDcuMFKanQECDAAqw0LA+GRiqAAAAABJRU5ErkJggg==);
        background-color: transparent;
        background-repeat: no-repeat;
        background-position: center right;
        cursor: pointer;
        float: right;
        margin-top: 9px;
        margin-right: 9px;
        height: 16px;
        width: 16px;
        opacity: 0.7;
    }
    button:hover {
        opacity: 1;
    }

    .title {
        padding: 24px 24px 0 24px;
        display: block;
    }

    .content {
        width: 100%;
        overflow: auto;
        word-wrap: break-word;
        padding: 24px 25px 25px 25px;
        font-size: 16px;
        line-height: 1.25;
        color: #acb2b8;
        position: relative;
        max-height: calc(100vh - 100px);
        box-sizing: border-box;
    }

    .buttons {
        text-align: right;
    }

    .bg {
        position: fixed;
        background: #000000;
        opacity: 0.8;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }
</style>