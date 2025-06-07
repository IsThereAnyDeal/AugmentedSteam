<script lang="ts">
    import {__activateMultiple} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import MultiProductKeysForm from "@Content/Features/Store/RegisterKey/Components/MultiProductKeysForm.svelte";
    import type UserInterface from "@Core/User/UserInterface";

    export let user: UserInterface;

    function showDialog(): void {
        const dialog = new MultiProductKeysForm({
            target: document.body,
            props: {
                user,
                value: document.querySelector<HTMLInputElement>("#product_key")!.value.replace(/,/g, "\n")
            }
        });
        dialog.$on("close", () => {
            dialog.$destroy();
        });
    }
</script>


<button type="button" class="btnv6_blue_hoverfade btn_medium" on:click={showDialog}>
    <span>{L(__activateMultiple)}</span>
</button>
<div style="clear: both;"></div>


<style>
    button {
        margin-bottom: 15px;
    }
</style>