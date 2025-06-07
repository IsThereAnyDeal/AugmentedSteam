<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __activateMultipleHeader,
        __activateProducts,
        __cancel,
        __error,
        __loading,
        __register_already,
        __register_default,
        __register_dlc,
        __register_invalid,
        __register_notavail,
        __register_owned,
        __register_success,
        __register_toomany,
        __register_wallet
    } from "@Strings/_strings";
    import {createEventDispatcher} from "svelte";
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import type UserInterface from "@Core/User/UserInterface";
    import {EModalAction} from "@Core/Modals/Contained/EModalAction";
    import RequestData from "@Content/Modules/RequestData";

    interface TActivationResult {
        success: number,
        purchase_result_details: number,
        purchase_receipt_info: {
            line_items: Array<{
                line_item_description: string
            }>
        }
    }

    const dispatch = createEventDispatcher<{
        close: void
    }>();

    export let value: string;
    export let user: UserInterface;

    let keys: [string, Promise<TActivationResult>][] = [];
    let buttons: {
        primary?: string,
        cancel?: string
    } = {
        primary: L(__activateProducts),
        cancel: L(__cancel)
    };

    async function activateKey(key: string): Promise<TActivationResult> {
        const response = await RequestData.post("https://store.steampowered.com/account/ajaxregisterkey", {
            sessionid: user.sessionId!,
            product_key: key
        });
        return await response.json() as TActivationResult;
    }

    async function activate(): Promise<void> {
        buttons = {};

        const lines = value.trim().split("\n");
        for (const line of lines) {
            // remove all whitespace and non-key characters
            const key = line.replace(/[^0-9A-Za-z]/g, "");
            if (key === "") { // skip blank rows in the input dialog (including trailing newline)
                continue;
            }

            keys.push([line.trim(), activateKey(key)]);
        }
        keys = keys;

        await Promise.all(keys.map(([_, promise]) => promise));

        buttons = {
            cancel: L(__cancel)
        }
    }

    async function handleButton(e: CustomEvent<EModalAction>): Promise<void> {
        const response = e.detail;
        if (response === EModalAction.OK) {
            activate();
        } else if (response === EModalAction.Cancel) {
            dispatch("close");
            return;
        }
    }

    function gameName(result: TActivationResult): string {
        return result.purchase_receipt_info.line_items[0]?.line_item_description ?? "";
    }
</script>


<Modal title={L(__activateMultipleHeader)} {buttons} on:button={handleButton}>
    {#if keys.length > 0}
        <ul>
            {#each keys as [key, promise]}
                <li>
                    {#await promise}
                        <i class="loading"></i>{key}
                        <div>{L(__loading)}</div>
                    {:then result}
                        {#if result.success === 1}
                            <i class="success"></i>{key}
                            {#if result.purchase_receipt_info.line_items.length > 0}
                                <div>{L(__register_success, {"gamename": gameName(result)})}</div>
                            {/if}
                        {:else}
                            <i class="error"></i>{key}
                            {#if result.purchase_receipt_info.line_items.length > 0}
                                <div>{gameName(result)}</div>
                            {/if}
                            <div>
                                {#if result.purchase_result_details === 9}
                                    {L(__register_owned)}
                                {:else if result.purchase_result_details === 13}
                                    {L(__register_notavail)}
                                {:else if result.purchase_result_details === 14}
                                    {L(__register_invalid)}
                                {:else if result.purchase_result_details === 15}
                                    {L(__register_already)}
                                {:else if result.purchase_result_details === 24}
                                    {L(__register_dlc)}
                                {:else if result.purchase_result_details === 50}
                                    {L(__register_wallet)}
                                {:else if result.purchase_result_details === 53}
                                    {L(__register_toomany)}
                                {:else}
                                    {L(__register_default)}
                                {/if}
                            </div>
                        {/if}
                    {:catch e}
                        <i class="error"></i>{key}
                        <div>{L(__error)}</div>
                    {/await}
                </li>
            {/each}
        </ul>
    {:else}
        <textarea rows="24" maxlength="1080" bind:value></textarea>
    {/if}
</Modal>


<style>
    textarea {
        outline: none;
        background-color: rgba(0,0,0,0.2);
        border: 1px solid #000;
        box-shadow: 1px 1px 0 0 rgba( 91, 132, 181, 0.2 );
        font-size: 13px;
        color: #BFBFBF;
        width: 100%;
        padding: 5px;
    }

    ul {
        list-style-type: none;
        padding: 0;
        font-size: 15px;
        max-width: 500px;
    }

    li {
        color: white;

        & + li {
            margin-top: 8px;
        }

        & div {
            font-size: 12px;
            margin-left: 17px;
            color: #c6d4df;
        }
    }

    i {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 6px;
        margin-right: 5px;

        &.loading {
            background: #67c1f5;
        }
        &.success {
            background: #5c7e10;
        }
        &.error {
            background: #9a2820;
        }
    }
</style>
